import { getAuthenticatedUserId } from "@/lib/server/auth";
import { executeAIAction } from "@/lib/server/aiActions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const action = (await request.json()) as { type?: unknown; payload?: Record<string, unknown> };

    const result = await executeAIAction(userId, {
      type: action.type,
      payload: action.payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute AI action.";
    const status =
      message.includes("Authentication") || message.includes("Invalid authentication")
        ? 401
        : message.includes("required") || message.includes("Unsupported") || message.includes("not found")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
