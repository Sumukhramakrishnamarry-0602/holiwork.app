import type { CalendarEvent, TaskItem } from "@/lib/types";
import { buildDayPlan, type PlannedBlock } from "@/lib/productivity/planner";

export interface AdaptivePlan {
  blocks: PlannedBlock[];
  unscheduled: TaskItem[];
  summary: string;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildAdaptivePlan(tasks: TaskItem[], events: CalendarEvent[], now = new Date()): AdaptivePlan {
  const base = buildDayPlan(tasks, events, now);
  const scheduledIds = new Set(base.filter((b) => b.type === "task").map((b) => b.id));
  const pending = tasks.filter((task) => !task.completed && !scheduledIds.has(task.id));
  const today = dayKey(now);

  const unscheduled = [...pending].sort((a, b) => {
    const priority = { High: 0, Medium: 1, Low: 2 };
    const urgency = (task: TaskItem) => {
      if (!task.dueDate) return 999;
      if (task.dueDate < today) return -2;
      if (task.dueDate === today) return -1;
      return 0;
    };
    return urgency(a) - urgency(b) || priority[a.priority] - priority[b.priority] || a.title.localeCompare(b.title);
  });

  const plannedCount = base.filter((b) => b.type === "task").length;
  const summary = unscheduled.length
    ? `${plannedCount} tasks planned today. ${unscheduled.length} remain unscheduled so the plan does not overload your day.`
    : `Your plan fits today's selected tasks around your existing calendar events.`;

  return { blocks: base, unscheduled, summary };
}
