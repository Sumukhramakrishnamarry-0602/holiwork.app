import type { CalendarEvent, TaskItem } from "@/lib/types";

export interface PlannedBlock {
  type: "task" | "event";
  id: string;
  title: string;
  start: string;
  end: string;
  reason?: string;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function taskDuration(task: TaskItem) {
  const text = task.description.toLowerCase();
  if (text.includes("exam") || text.includes("project")) return 90;
  if (task.priority === "High") return 60;
  return 45;
}

export function buildDayPlan(tasks: TaskItem[], events: CalendarEvent[], now = new Date()): PlannedBlock[] {
  const day = startOfDay(now);
  const dayKey = day.toISOString().slice(0, 10);

  const fixed = events
    .filter((event) => {
      const start = new Date(event.startTime);
      return start.toISOString().slice(0, 10) === dayKey;
    })
    .map((event) => ({
      type: "event" as const,
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
    }))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const pending = tasks
    .filter((task) => !task.completed && (!task.dueDate || task.dueDate === dayKey))
    .sort((a, b) => {
      const priority = { High: 0, Medium: 1, Low: 2 };
      return priority[a.priority] - priority[b.priority];
    });

  const blocks: PlannedBlock[] = [...fixed];
  let cursor = new Date(Math.max(now.getTime(), new Date(day).setHours(8, 0, 0, 0)));

  for (const task of pending) {
    const duration = taskDuration(task);
    const nextEvent = fixed.find((event) => new Date(event.start).getTime() >= cursor.getTime());

    if (nextEvent && addMinutes(cursor, duration).getTime() > new Date(nextEvent.start).getTime()) {
      cursor = new Date(nextEvent.end);
    }

    const end = addMinutes(cursor, duration);
    if (end.getHours() >= 22) break;

    blocks.push({
      type: "task",
      id: task.id,
      title: task.title,
      start: cursor.toISOString(),
      end: end.toISOString(),
      reason: task.priority === "High" ? "High priority" : "Fits your available time",
    });

    cursor = addMinutes(end, 15);
  }

  return blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function formatPlanTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
