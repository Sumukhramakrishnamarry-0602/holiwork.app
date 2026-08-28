import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getUserAssistantContext } from "@/lib/server/userContext";
import { generateAdaptivePlan } from "@/lib/ai/server";
import { buildAdaptivePlan } from "@/lib/productivity/adaptivePlanner";
import { NextResponse } from "next/server";

const MAX_GOAL_LENGTH = 1000;

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { nowIso?: unknown; timezone?: unknown; goal?: unknown };
    const nowIso = typeof payload.nowIso === "string" ? payload.nowIso : new Date().toISOString();
    const timezone = typeof payload.timezone === "string" ? payload.timezone.slice(0, 100) : "UTC";
    const goal = typeof payload.goal === "string" ? payload.goal.trim().slice(0, MAX_GOAL_LENGTH) : "";
    if (!goal) return NextResponse.json({ error: "Planning goal is required." }, { status: 400 });

    const context = await getUserAssistantContext(userId, nowIso, timezone);
    const basePlan = buildAdaptivePlan(context.tasks, context.events, new Date(nowIso));
    const aiPlan = await generateAdaptivePlan({ context, goal });

    return NextResponse.json({ ...basePlan, ai: aiPlan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build adaptive plan.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
