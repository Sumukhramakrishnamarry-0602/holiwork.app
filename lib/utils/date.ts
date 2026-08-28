import type { CalendarEvent, TaskItem } from "@/lib/types";

export function getGreeting(name: string) {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${name}`;
}

export function toLocalLabel(iso: string) {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isTodayDateString(dateString: string) {
  if (!dateString) return false;
  const today = new Date();
  const input = new Date(dateString);
  return (
    input.getFullYear() === today.getFullYear() &&
    input.getMonth() === today.getMonth() &&
    input.getDate() === today.getDate()
  );
}

export function isFutureDateString(dateString: string) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const input = new Date(dateString);
  input.setHours(0, 0, 0, 0);
  return input.getTime() > today.getTime();
}

export function taskDueIso(task: TaskItem) {
  if (!task.dueDate) return "9999-12-31T23:59:59.000Z";
  const datePart = task.dueDate;
  const timePart = task.dueTime ? `${task.dueTime}:00` : "23:59:00";
  return new Date(`${datePart}T${timePart}`).toISOString();
}

export function sortTasksByDue(items: TaskItem[]) {
  return [...items].sort((a, b) => new Date(taskDueIso(a)).getTime() - new Date(taskDueIso(b)).getTime());
}

export function sortEventsByStart(items: CalendarEvent[]) {
  return [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function currentTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
