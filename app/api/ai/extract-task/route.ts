import { getAuthenticatedUserId } from "@/lib/server/auth";
import { extractTask } from "@/lib/ai/server";
import { NextResponse } from "next/server";

const MAX_INPUT_LENGTH = 1000;

export async function POST(request: Request) {
  try {
    await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { text?: unknown; nowIso?: unknown; timezone?: unknown };

    if (typeof payload.text !== "string" || !payload.text.trim()) {
      return NextResponse.json({ error: "Task text is required." }, { status: 400 });
    }

    const extracted = await extractTask({
      text: payload.text.trim().slice(0, MAX_INPUT_LENGTH),
      nowIso: typeof payload.nowIso === "string" ? payload.nowIso : new Date().toISOString(),
      timezone: typeof payload.timezone === "string" ? payload.timezone.slice(0, 100) : "UTC",
    });

    return NextResponse.json(extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract task details.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
