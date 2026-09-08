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
  const [error, setError] = useState<string | null>(null);
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  async function plan() {
    if (!goal.trim()) return;
    setLoading(true); setError(null); setApplied(false);
    try {
      const result = await aiService.generatePlan({ goal: goal.trim(), nowIso: new Date().toISOString(), timezone: currentTimezone() });
      setMessage(result.ai.message);
      setPriorities(result.ai.priorities);
      setBlocks(result.blocks as PlanBlock[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build your plan.");
    } finally { setLoading(false); }
  }

  async function applyPlan() {
    const taskBlocks = blocks
      .filter((block) => block.type === "task" && taskById.has(block.id))
      .map((block) => ({ taskId: block.id, start: block.start, end: block.end }));
    if (!taskBlocks.length) return;
    setApplying(true); setError(null);
    try {
      await aiService.applyPlan(taskBlocks);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply your plan.");
    } finally { setApplying(false); }
  }

  return (
    <section className="card">
      <p className="status">Adaptive planner</p>
      <h2>Tell Holiwork what matters today.</h2>
      <div className="row">
        <input value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void plan(); }} placeholder="e.g. I have an exam tomorrow and need to study" aria-label="Planning goal" />
        <button className="primary-btn" disabled={loading || !goal.trim()} onClick={() => void plan()}>{loading ? "Planning..." : "Plan my day"}</button>
      </div>
      {error && <p className="status error">{error}</p>}
      {message && <p>{message}</p>}
      {blocks.length > 0 && (
        <div>
          <p className="status">Suggested schedule</p>
          {blocks.filter((block) => block.type === "task").map((block) => {
            const task = taskById.get(block.id);
            return task ? (
              <div className="event-item" key={block.id}>
                <strong>{task.title}</strong>
                <p className="status">{new Date(block.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(block.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
              </div>
            ) : null;
          })}
          {priorities.length > 0 && <p className="status">{priorities.length} AI-prioritized tasks.</p>}
          <div className="row">
            <button className="primary-btn" disabled={applying || applied} onClick={() => void applyPlan()}>{applied ? "Added to calendar" : applying ? "Adding..." : "Apply to calendar"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
