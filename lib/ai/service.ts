import { getFirebaseAuth } from "@/lib/firebase/client";
import type { AIChatRequest, AIDailyBriefRequest, AIServerReply } from "@/lib/ai/types";

async function getAuthHeaders() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Authentication required.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await user.getIdToken()}`,
  };
}

async function postJSON<TResponse>(url: string, body: object): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as TResponse & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
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
  executeAction(action: AIServerReply["action"]) {
    if (!action || action.type === "none") return Promise.resolve({ type: "none" as const, success: true });
    return postJSON<{ type: string; success: boolean }>("/api/ai/action", action);
  },
};
