export type TaskPriority = "Low" | "Medium" | "High";

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  reminderTime: string;
  completed: boolean;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  updatedAt?: string;
}

export interface AssistantContext {
  tasks: TaskItem[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  nowIso: string;
  timezone: string;
}
