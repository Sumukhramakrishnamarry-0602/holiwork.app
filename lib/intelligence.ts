import type { CalendarEvent, ReminderItem, TaskItem, TaskPriority } from "@/lib/types";

interface ScoredTask {
  task: TaskItem;
  score: number;
  reasons: string[];
}

function priorityPoints(priority: TaskPriority) {
  if (priority === "High") return 3;
  if (priority === "Medium") return 1;
  return -1;
}

function dueUrgency(task: TaskItem, now = new Date()) {
  if (!task.dueDate) return { points: 0, reason: "No due date" };
  const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
  const diffMs = due.getTime() - now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (task.completed) return { points: -6, reason: "Already completed" };
  if (diffMs < 0) return { points: 7, reason: "Overdue" };
  if (diffMs <= dayMs) return { points: 5, reason: "Due today" };
  if (diffMs <= 2 * dayMs) return { points: 3, reason: "Due tomorrow" };
  if (diffMs <= 7 * dayMs) return { points: 1, reason: "Due this week" };
  return { points: 0, reason: "Later deadline" };
}

export function scoreTasks(tasks: TaskItem[], now = new Date()): ScoredTask[] {
  return tasks
    .map((task) => {
      const urgency = dueUrgency(task, now);
      const points = priorityPoints(task.priority);
      const score = urgency.points + points;
      const reasons = [urgency.reason, `${task.priority} priority`];
      return { task, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function getFocusRecommendation(tasks: TaskItem[], events: CalendarEvent[]) {
  const now = new Date();
  const scored = scoreTasks(tasks.filter((task) => !task.completed), now);
  const best = scored[0];
  if (!best) return null;

  const nextEvent = [...events]
    .filter((event) => new Date(event.startTime).getTime() > now.getTime())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const freeMinutes = nextEvent
    ? Math.max(0, Math.floor((new Date(nextEvent.startTime).getTime() - now.getTime()) / 60000))
    : 120;

  return {
    task: best.task,
    reasons: best.reasons,
    freeMinutes,
  };
}

export function summarizeDayStats(tasks: TaskItem[], events: CalendarEvent[], reminders: ReminderItem[]) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const isToday = (value: string) => {
    if (!value) return false;
    const date = new Date(value);
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  };

  const todayTasks = tasks.filter((task) => task.dueDate && isToday(`${task.dueDate}T${task.dueTime || "23:59"}`));
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(`${task.dueDate}T${task.dueTime || "23:59"}`).getTime() < now.getTime();
  });
  const highPriority = tasks.filter((task) => !task.completed && task.priority === "High");
  const todayEvents = events.filter((event) => isToday(event.startTime));
  const dueReminders = reminders.filter((reminder) => !reminder.completed && isToday(reminder.reminderTime));

  return {
    todayTasksCount: todayTasks.length,
    completedTodayTasks: todayTasks.filter((task) => task.completed).length,
    overdueCount: overdueTasks.length,
    highPriorityCount: highPriority.length,
    todayEventsCount: todayEvents.length,
    reminderCount: dueReminders.length,
  };
}
