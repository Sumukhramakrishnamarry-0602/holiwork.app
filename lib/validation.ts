import type { AIAction } from "@/lib/ai/types";

export function validateNonEmptyTitle(value: string, entity: string) {
  if (!value.trim()) {
    throw new Error(`${entity} title cannot be empty.`);
  }
}

export function validateDate(value: string, fieldName: string) {
  if (!value) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }
}

export function validateDateRange(startIso: string, endIso: string) {
  validateDate(startIso, "Start time");
  validateDate(endIso, "End time");
  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    throw new Error("End time must be after start time.");
  }
}

const validPriorities = new Set(["Low", "Medium", "High"]);

export function validatePriority(value: string) {
  if (!validPriorities.has(value)) {
    throw new Error("Priority must be Low, Medium, or High.");
  }
}

const ACTIONS: Record<string, true> = {
  none: true,
  createTask: true,
  updateTask: true,
  completeTask: true,
  deleteTask: true,
  createEvent: true,
  updateEvent: true,
  deleteEvent: true,
  createReminder: true,
  updateReminder: true,
  deleteReminder: true,
  getTodayTasks: true,
  getUpcomingTasks: true,
  getOverdueTasks: true,
  getTodayEvents: true,
  getUpcomingEvents: true,
  getReminders: true,
};

export function validateAIAction(action: AIAction | undefined) {
  if (!action) return;
  if (!ACTIONS[action.type]) {
    throw new Error("AI returned an unsupported action.");
  }
}
