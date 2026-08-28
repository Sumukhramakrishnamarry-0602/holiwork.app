import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getUserAssistantContext } from "@/lib/server/userContext";
import { generateDailyBrief } from "@/lib/ai/server";
import type { AIDailyBriefRequest } from "@/lib/ai/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as Partial<AIDailyBriefRequest>;
    const nowIso = typeof payload.context?.nowIso === "string" ? payload.context.nowIso : new Date().toISOString();
    const timezone = typeof payload.context?.timezone === "string" ? payload.context.timezone : "UTC";
    const context = await getUserAssistantContext(userId, nowIso, timezone);
    const brief = await generateDailyBrief({ context });
    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate daily brief.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
