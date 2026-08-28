import type { AIChatRequest, AIDailyBriefRequest, AIServerReply } from "@/lib/ai/types";

async function postJSON<TResponse>(url: string, body: object): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as TResponse & { error?: string };

  if (!response.ok) {
    const message = (payload as { error?: string }).error || "AI request failed.";
    throw new Error(message);
  }

  return payload;
}

export const aiService = {
  chat(request: AIChatRequest) {
    return postJSON<AIServerReply>("/api/ai/chat", request);
  },
  generateDailyBrief(request: AIDailyBriefRequest) {
    return postJSON<{ brief: string }>("/api/ai/daily-brief", request);
  },
  extractTask(input: { text: string; nowIso: string; timezone: string }) {
    return postJSON<{
      title: string;
      description: string;
      dueDate: string;
      dueTime: string;
      priority: "Low" | "Medium" | "High";
      category: string;
    }>("/api/ai/extract-task", input);
  },
  extractReminder(input: { text: string; nowIso: string; timezone: string }) {
    return postJSON<{ title: string; description: string; reminderTime: string }>("/api/ai/extract-reminder", input);
  },
};
