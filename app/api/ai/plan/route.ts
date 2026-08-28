import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getUserAssistantContext } from "@/lib/server/userContext";
import { buildAdaptivePlan } from "@/lib/productivity/adaptivePlanner";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { nowIso?: unknown; timezone?: unknown };
    const nowIso = typeof payload.nowIso === "string" ? payload.nowIso : new Date().toISOString();
    const timezone = typeof payload.timezone === "string" ? payload.timezone.slice(0, 100) : "UTC";
    const context = await getUserAssistantContext(userId, nowIso, timezone);
    const plan = buildAdaptivePlan(context.tasks, context.events, new Date(nowIso));

    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build plan.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
