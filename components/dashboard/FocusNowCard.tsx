"use client";

import type { FocusRecommendation } from "@/lib/productivity/focus";
import Link from "next/link";

export function FocusNowCard({ recommendation }: { recommendation: FocusRecommendation }) {
  if (!recommendation.task) {
    return (
      <section className="card">
        <div className="row space-between">
          <div>
            <p className="status">Focus now</p>
            <h2>You&apos;re all caught up</h2>
          </div>
          <Link className="secondary-btn" href="/tasks">View tasks</Link>
        </div>
        <p>{recommendation.reason}</p>
      </section>
    );
  }

  const { task } = recommendation;

  return (
    <section className="card">
      <div className="row space-between">
        <div>
          <p className="status">Focus now</p>
          <h2>{task.title}</h2>
        </div>
        <span className="badge">{task.priority}</span>
      </div>
      <p>{recommendation.reason}</p>
      <p className="status">
        {task.dueDate ? `Due: ${task.dueDate}${task.dueTime ? ` at ${task.dueTime}` : ""}` : "No due date"}
      </p>
      <Link className="primary-btn" href="/tasks">Start task</Link>
    </section>
  );
}
