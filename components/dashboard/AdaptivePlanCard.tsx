"use client";

import { aiService } from "@/lib/ai/service";
import { currentTimezone } from "@/lib/utils/date";
import type { CalendarEvent, TaskItem } from "@/lib/types";
import { useMemo, useState } from "react";

interface Priority { taskId: string; reason: string }
interface PlanBlock { type: "task" | "event"; id: string; title: string; start: string; end: string; reason?: string }

export function AdaptivePlanCard({ tasks, events }: { tasks: TaskItem[]; events: CalendarEvent[] }) {
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [planSignature, setPlanSignature] = useState("");
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  const currentSignature = useMemo(() => JSON.stringify({
    tasks: tasks.map((task) => ({
      id: task.id,
      completed: task.completed,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      title: task.title,
    })).sort((a, b) => a.id.localeCompare(b.id)),
    events: events.map((event) => ({
      id: event.id,
      startTime: event.startTime,
      endTime: event.endTime,
      title: event.title,
    })).sort((a, b) => a.id.localeCompare(b.id)),
  }), [tasks, events]);
  const planIsStale = Boolean(planSignature && planSignature !== currentSignature);

  async function plan() {
    if (!goal.trim()) return;
    const signatureAtRequest = currentSignature;
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
      setPlanSignature(signatureAtRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your plan.");
    } finally {
      setLoading(false);
    }
  }

  async function applyPlan() {
    if (planIsStale) {
      setError("Your tasks or calendar changed. Re-plan before applying this schedule.");
      return;
    }
    const taskBlocks = blocks
      .filter((block) => block.type === "task" && taskById.has(block.id) && !taskById.get(block.id)?.completed)
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

  const scheduledTaskBlocks = blocks.filter((block) => block.type === "task" && taskById.has(block.id) && !taskById.get(block.id)?.completed);

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
          {loading ? "Re-planning..." : blocks.length ? "Re-plan my day" : "Plan my day"}
        </button>
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
      {planIsStale && !applied && (
        <p className="status" role="status">
          Your tasks or calendar changed since this plan was created. Re-plan your day before applying it.
        </p>
      )}
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
              disabled={applying || applied || planIsStale || scheduledTaskBlocks.length === 0}
              onClick={() => void applyPlan()}
            >
              {applied ? "Added to calendar" : applying ? "Adding..." : planIsStale ? "Re-plan to apply" : "Apply to calendar"}
            </button>
          </div>
          {applyMessage && <p className="status" role="status">{applyMessage}</p>}
        </div>
      )}
    </section>
  );
}
