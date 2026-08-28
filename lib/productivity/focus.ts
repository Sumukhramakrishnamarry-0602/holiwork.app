import type { CalendarEvent, TaskItem } from "@/lib/types";

export interface FocusRecommendation {
  task: TaskItem | null;
  score: number;
  reason: string;
}

function dayStart(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function scoreTask(task: TaskItem, now = new Date()) {
  if (task.completed) return -Infinity;

  let score = task.priority === "High" ? 40 : task.priority === "Medium" ? 20 : 5;
  const today = dayStart(now).getTime();

  if (task.dueDate) {
    const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
    const days = Math.ceil((dayStart(due).getTime() - today) / 86400000);

    if (days < 0) score += 100;
    else if (days === 0) score += 70;
    else if (days === 1) score += 45;
    else if (days <= 7) score += 20;
  } else {
    score += 2;
  }

  return score;
}

export function getFocusRecommendation(
  tasks: TaskItem[],
  events: CalendarEvent[],
  now = new Date(),
): FocusRecommendation {
  const candidates = tasks
    .filter((task) => !task.completed)
    .map((task) => ({ task, score: scoreTask(task, now) }))
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return { task: null, score: 0, reason: "You have no pending tasks right now." };

  const task = top.task;
  if (task.dueDate) {
    const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
    if (due.getTime() < now.getTime()) return { task, score: top.score, reason: "This task is overdue, so it should be handled first." };
    if (dayStart(due).getTime() === dayStart(now).getTime()) return { task, score: top.score, reason: "This task is due today." };
  }

  if (task.priority === "High") return { task, score: top.score, reason: "This is your highest-priority pending task." };
  if (events.length === 0) return { task, score: top.score, reason: "Your schedule is open, so this is a good task to tackle now." };

  return { task, score: top.score, reason: "Based on priority and upcoming deadlines, this is your best next task." };
}
