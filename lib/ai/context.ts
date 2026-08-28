import type { AssistantContext } from "@/lib/types";

export function compactContext(context: AssistantContext) {
  return {
    nowIso: context.nowIso,
    timezone: context.timezone,
    tasks: context.tasks.map((task) => ({
      title: task.title,
      completed: task.completed,
      priority: task.priority,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      category: task.category,
    })),
    events: context.events.map((event) => ({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
    })),
    reminders: context.reminders.map((reminder) => ({
      title: reminder.title,
      reminderTime: reminder.reminderTime,
      completed: reminder.completed,
    })),
  };
}
