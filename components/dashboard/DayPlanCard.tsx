"use client";

import type { PlannedBlock } from "@/lib/productivity/planner";
import { formatPlanTime } from "@/lib/productivity/planner";
import Link from "next/link";

export function DayPlanCard({ blocks }: { blocks: PlannedBlock[] }) {
  const tasks = blocks.filter((block) => block.type === "task");

  return (
    <section className="card">
      <div className="row space-between">
        <div>
          <p className="status">Smart plan</p>
          <h2>Your day, organized</h2>
        </div>
        <Link className="secondary-btn" href="/calendar">Open calendar</Link>
      </div>

      {blocks.length === 0 ? (
        <p className="status">Nothing is scheduled for today. You have room to plan.</p>
      ) : (
        <div>
          {blocks.slice(0, 8).map((block) => (
            <div className="event-item" key={`${block.type}-${block.id}`}>
              <div className="row space-between">
                <strong>{block.title}</strong>
                <span className="badge">{block.type}</span>
              </div>
              <p className="status">
                {formatPlanTime(block.start)} – {formatPlanTime(block.end)}
                {block.reason ? ` · ${block.reason}` : ""}
              </p>
            </div>
          ))}
          {tasks.length === 0 && <p className="status">No tasks were available to schedule around today&apos;s events.</p>}
        </div>
      )}
    </section>
  );
}
