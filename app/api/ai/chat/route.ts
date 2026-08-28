import { getAuthenticatedUserId } from "@/lib/server/auth";
import { generateAssistantReply } from "@/lib/ai/server";
import type { AIChatRequest } from "@/lib/ai/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await getAuthenticatedUserId(request);
    const payload = (await request.json()) as AIChatRequest;
    const reply = await generateAssistantReply(payload);

    return NextResponse.json({
      message: reply.message,
      action: reply.action || { type: "none" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate assistant response.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}