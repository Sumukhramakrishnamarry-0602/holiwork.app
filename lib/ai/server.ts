import { compactContext } from "@/lib/ai/context";
import {
  adaptivePlanPrompt,
  assistantSystemPrompt,
  dailyBriefPrompt,
  extractReminderPrompt,
  extractTaskPrompt,
} from "@/lib/ai/prompts";
import { runAI } from "@/lib/ai/provider";
import type { AIPlanResponse } from "@/lib/ai/types";
import type { AssistantContext, ChatMessage } from "@/lib/types";

function safeParseObject<T>(value: string): T {
  return JSON.parse(value) as T;
}

export async function generateAssistantReply(input: { messages: ChatMessage[]; context: AssistantContext }) {
  const contextPayload = compactContext(input.context);
  const history = input.messages.map((message) => ({ role: message.role, content: message.content }));
  const result = await runAI([
    { role: "system", content: assistantSystemPrompt },
    { role: "user", content: `Context JSON:\n${JSON.stringify(contextPayload)}\n\nConversation JSON:\n${JSON.stringify(history)}` },
  ]);
  return safeParseObject<{ message: string; action?: { type: "none" | "createTask" | "createEvent" | "createReminder"; payload?: Record<string, string> } }>(result.content);
}

export async function generateDailyBrief(input: { context: AssistantContext }) {
  const result = await runAI([
    { role: "system", content: dailyBriefPrompt },
    { role: "user", content: JSON.stringify(compactContext(input.context)) },
  ]);
  return safeParseObject<{ brief: string }>(result.content).brief;
}

export async function generateAdaptivePlan(input: { context: AssistantContext; goal: string }) {
  const result = await runAI([
    { role: "system", content: adaptivePlanPrompt },
    { role: "user", content: `Goal: ${input.goal}\n\nContext JSON:\n${JSON.stringify(compactContext(input.context))}` },
  ]);
  const parsed = safeParseObject<AIPlanResponse>(result.content);
  const validIds = new Set(input.context.tasks.filter((task) => !task.completed).map((task) => task.id));
  return {
    message: parsed.message,
    priorities: (Array.isArray(parsed.priorities) ? parsed.priorities : [])
      .filter((item) => validIds.has(item.taskId))
      .slice(0, 5),
  } satisfies AIPlanResponse;
}

export async function extractTask(input: { text: string; nowIso: string; timezone: string }) {
  const result = await runAI([{ role: "system", content: extractTaskPrompt }, { role: "user", content: JSON.stringify(input) }]);
  return safeParseObject<{ title: string; description: string; dueDate: string; dueTime: string; priority: "Low" | "Medium" | "High"; category: string }>(result.content);
}

export async function extractReminder(input: { text: string; nowIso: string; timezone: string }) {
  const result = await runAI([{ role: "system", content: extractReminderPrompt }, { role: "user", content: JSON.stringify(input) }]);
  return safeParseObject<{ title: string; description: string; reminderTime: string }>(result.content);
}
