import { getAuthenticatedUserId } from "@/lib/server/auth";
import { extractReminder } from "@/lib/ai/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { text: string; nowIso: string; timezone: string };
    const extracted = await extractReminder(payload);
    return NextResponse.json(extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract reminder details.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}