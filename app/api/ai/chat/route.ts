import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getUserAssistantContext } from "@/lib/server/userContext";
import { generateAssistantReply } from "@/lib/ai/server";
import type { AIChatRequest, AIServerReply } from "@/lib/ai/types";
import { NextResponse } from "next/server";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as Partial<AIChatRequest>;

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return NextResponse.json({ error: "At least one message is required." }, { status: 400 });
    }

    const messages = payload.messages
      .slice(-MAX_MESSAGES)
      .filter((message) => message && (message.role === "user" || message.role === "assistant"))
      .map((message) => ({
        id: String(message.id || ""),
        role: message.role!,
        content: String(message.content || "").slice(0, MAX_MESSAGE_LENGTH),
        createdAt: String(message.createdAt || ""),
      }));

    if (!messages.length || !messages.at(-1)?.content.trim()) {
      return NextResponse.json({ error: "A valid message is required." }, { status: 400 });
    }

    const nowIso = typeof payload.context?.nowIso === "string" ? payload.context.nowIso : new Date().toISOString();
    const timezone = typeof payload.context?.timezone === "string" ? payload.context.timezone : "UTC";
    const context = await getUserAssistantContext(userId, nowIso, timezone);
    const reply = await generateAssistantReply({ messages, context });

    return NextResponse.json({
      message: reply.message,
      action: reply.action || ({ type: "none" } satisfies AIServerReply["action"]),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate assistant response.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
