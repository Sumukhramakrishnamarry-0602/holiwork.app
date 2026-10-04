"use client";

import { aiService } from "@/lib/ai/service";
import { currentTimezone } from "@/lib/utils/date";
import type { TaskItem } from "@/lib/types";
import { useState } from "react";

interface Priority { taskId: string; reason: string }
interface PlanBlock { type: "task" | "event"; id: string; title: string; start: string; end: string; reason?: string }

export function AdaptivePlanCard({ tasks }: { tasks: TaskItem[] }) {
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  async function plan() {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setApplyMessage("");
    setApplied(false);
    try {
      const result = await aiService.generatePlan({
        goal: goal.trim(),
        nowIso: new Date().toISOString(),
        timezone: currentTimezone(),
      });
      setMessage(result.ai.message);
      setPriorities(result.ai.priorities);
      setBlocks(result.blocks as PlanBlock[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your plan.");
    } finally {
      setLoading(false);
    }
  }

  async function applyPlan() {
    const taskBlocks = blocks
      .filter((block) => block.type === "task" && taskById.has(block.id))
      .map((block) => ({ taskId: block.id, start: block.start, end: block.end }));
    if (!taskBlocks.length) return;

    setApplying(true);
    setError(null);
    setApplyMessage("");
    try {
      const result = await aiService.applyPlan(taskBlocks);
      setApplied(true);
      setApplyMessage(
        result.createdBlocks === 0
          ? "These focus blocks were already on your calendar, so no duplicates were added."
          : `Added ${result.createdBlocks} focus block${result.createdBlocks === 1 ? "" : "s"} to your calendar.${result.skippedExisting ? ` ${result.skippedExisting} existing block${result.skippedExisting === 1 ? " was" : "s were"} skipped.` : ""}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply your plan.");
    } finally {
      setApplying(false);
    }
  }

  const scheduledTaskBlocks = blocks.filter((block) => block.type === "task" && taskById.has(block.id));

  return (
    <section className="card">
      <p className="status">Adaptive planner</p>
      <h2>Tell Holiwork what matters today.</h2>
      <div className="row">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void plan(); }}
          placeholder="e.g. I have an exam tomorrow and need to study"
          aria-label="Planning goal"
        />
        <button className="primary-btn" disabled={loading || !goal.trim()} onClick={() => void plan()}>
          {loading ? "Planning..." : "Plan my day"}
        </button>
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
      {message && <p>{message}</p>}
      {blocks.length > 0 && (
        <div>
          <p className="status">Suggested schedule</p>
          {scheduledTaskBlocks.map((block) => (
            <div className="event-item" key={`${block.id}-${block.start}`}>
              <strong>{taskById.get(block.id)?.title ?? block.title}</strong>
              <p className="status">
                {new Date(block.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(block.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
              {block.reason && <p className="status">{block.reason}</p>}
            </div>
          ))}
          {scheduledTaskBlocks.length === 0 && <p className="status">No pending tasks could be scheduled for this plan.</p>}
          {priorities.length > 0 && <p className="status">{priorities.length} AI-prioritized tasks.</p>}
          <div className="row">
            <button
              className="primary-btn"
              disabled={applying || applied || scheduledTaskBlocks.length === 0}
              onClick={() => void applyPlan()}
            >
              {applied ? "Added to calendar" : applying ? "Adding..." : "Apply to calendar"}
            </button>
          </div>
          {applyMessage && <p className="status" role="status">{applyMessage}</p>}
        </div>
      )}
    </section>
  );
}
