import { getAuthenticatedUserId } from "@/lib/server/auth";
import { extractTask } from "@/lib/ai/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { text: string; nowIso: string; timezone: string };
    const extracted = await extractTask(payload);
    return NextResponse.json(extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract task details.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}