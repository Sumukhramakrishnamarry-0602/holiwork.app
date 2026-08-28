import { extractTask } from "@/lib/ai/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { text: string; nowIso: string; timezone: string };
    const extracted = await extractTask(payload);
    return NextResponse.json(extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract task details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
