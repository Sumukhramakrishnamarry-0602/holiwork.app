import { compactContext } from "@/lib/ai/context";
import {
  assistantSystemPrompt,
  dailyBriefPrompt,
  extractReminderPrompt,
  extractTaskPrompt,
} from "@/lib/ai/prompts";
import { runAI } from "@/lib/ai/provider";
import type { AssistantContext, ChatMessage } from "@/lib/types";

function safeParseObject<T>(value: string): T {
  return JSON.parse(value) as T;
}

export async function generateAssistantReply(input: { messages: ChatMessage[]; context: AssistantContext }) {
  const contextPayload = compactContext(input.context);
  const history = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const result = await runAI([
    { role: "system", content: assistantSystemPrompt },
    {
      role: "user",
      content: `Context JSON:\n${JSON.stringify(contextPayload)}\n\nConversation JSON:\n${JSON.stringify(history)}`,
    },
  ]);

  return safeParseObject<{
    message: string;
    action?: { type: "none" | "createTask" | "createEvent" | "createReminder"; payload?: Record<string, string> };
  }>(result.content);
}

export async function generateDailyBrief(input: { context: AssistantContext }) {
  const contextPayload = compactContext(input.context);
  const result = await runAI([
    { role: "system", content: dailyBriefPrompt },
    { role: "user", content: JSON.stringify(contextPayload) },
  ]);

  const parsed = safeParseObject<{ brief: string }>(result.content);
  return parsed.brief;
}

export async function extractTask(input: { text: string; nowIso: string; timezone: string }) {
  const result = await runAI([
    { role: "system", content: extractTaskPrompt },
    { role: "user", content: JSON.stringify(input) },
  ]);

  return safeParseObject<{
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: "Low" | "Medium" | "High";
    category: string;
  }>(result.content);
}

export async function extractReminder(input: { text: string; nowIso: string; timezone: string }) {
  const result = await runAI([
    { role: "system", content: extractReminderPrompt },
    { role: "user", content: JSON.stringify(input) },
  ]);

  return safeParseObject<{ title: string; description: string; reminderTime: string }>(result.content);
}
