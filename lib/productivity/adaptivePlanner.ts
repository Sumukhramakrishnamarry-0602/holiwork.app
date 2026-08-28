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

function duration(task: TaskItem) {
  const text = `${task.title} ${task.description}`.toLowerCase();
  if (/(exam|project|assignment|chapter|study)/.test(text)) return 60;
  if (task.priority === "High") return 60;
  return 45;
}

export function buildAdaptivePlan(
  tasks: TaskItem[],
  events: CalendarEvent[],
  now = new Date(),
): AdaptivePlan {
  const base = buildDayPlan(tasks, events, now);
  const scheduledIds = new Set(base.filter((b) => b.type === "task").map((b) => b.id));
  const pending = tasks.filter((task) => !task.completed && !scheduledIds.has(task.id));
  const today = dayKey(now);

  const urgent = pending.filter((task) => task.dueDate && task.dueDate <= today);
  const later = pending.filter((task) => !urgent.includes(task));
  const unscheduled = [...urgent, ...later].sort((a, b) => {
    const priority = { High: 0, Medium: 1, Low: 2 };
    return priority[a.priority] - priority[b.priority] || a.title.localeCompare(b.title);
  });

  const summary = unscheduled.length
    ? `${base.filter((b) => b.type === "task").length} tasks planned today. ${unscheduled.length} remain unscheduled so the plan does not overload your day.`
    : `Your plan fits the tasks selected for today around your existing calendar events.`;

  return { blocks: base, unscheduled };
}
