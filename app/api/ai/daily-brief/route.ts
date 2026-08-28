import { generateDailyBrief } from "@/lib/ai/server";
import type { AIDailyBriefRequest } from "@/lib/ai/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AIDailyBriefRequest;
    const brief = await generateDailyBrief(payload);
    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate daily brief.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
