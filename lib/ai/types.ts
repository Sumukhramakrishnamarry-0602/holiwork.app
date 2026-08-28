import type { AssistantContext, ChatMessage, TaskPriority } from "@/lib/types";

export interface AIChatRequest {
  messages: ChatMessage[];
  context: AssistantContext;
}

export interface AIServerReply {
  message: string;
  action?:
    | { type: "createTask"; payload: { title: string; description: string; dueDate: string; dueTime: string; priority: TaskPriority; category: string } }
    | { type: "createEvent"; payload: { title: string; description: string; startTime: string; endTime: string; location: string } }
    | { type: "createReminder"; payload: { title: string; description: string; reminderTime: string } }
    | { type: "none" };
}

export interface AIDailyBriefRequest {
  context: AssistantContext;
}
