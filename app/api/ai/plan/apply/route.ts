import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

function validIso(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { blocks?: Array<{ taskId?: unknown; start?: unknown; end?: unknown }> };
    if (!Array.isArray(payload.blocks) || payload.blocks.length === 0 || payload.blocks.length > 8) {
      return NextResponse.json({ error: "Select between 1 and 8 planned blocks." }, { status: 400 });
    }
    const blocks = payload.blocks.filter((block): block is { taskId: string; start: string; end: string } =>
      typeof block?.taskId === "string" && block.taskId.length > 0 && block.taskId.length <= 200 &&
      typeof block.start === "string" && validIso(block.start) && typeof block.end === "string" && validIso(block.end) &&
      Date.parse(block.end) > Date.parse(block.start));
    if (!blocks.length) return NextResponse.json({ error: "No valid plan blocks." }, { status: 400 });

    const db = getAdminDb();
    const batch = db.batch();
    const ids = [...new Set(blocks.map((block) => block.taskId))];
    const taskTitles = new Map<string, string>();
    for (const id of ids) {
      const task = await db.collection("tasks").doc(id).get();
      if (!task.exists || task.data()?.userId !== userId || task.data()?.completed) {
        return NextResponse.json({ error: "One or more selected tasks are unavailable." }, { status: 400 });
      }
      taskTitles.set(id, String(task.data()?.title || "Task"));
    }
    for (const block of blocks) {
      const ref = db.collection("events").doc();
      batch.set(ref, {
        userId,
        title: `Focus: ${taskTitles.get(block.taskId)?.slice(0, 250) || "Task"}`,
        description: "Holiwork focus block",
        startTime: block.start,
        endTime: block.end,
        location: "",
        taskId: block.taskId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    return NextResponse.json({ success: true, createdBlocks: blocks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply plan.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
