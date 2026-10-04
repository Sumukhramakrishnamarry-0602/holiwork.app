import { createHash } from "node:crypto";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

function validIso(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function focusEventId(taskId: string, start: string, end: string) {
  return createHash("sha256").update(`${taskId}| ${Date.parse(start)}| ${Date.parse(end)}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { blocks?: Array<{ taskId?: unknown; start?: unknown; end?: unknown }> };
    if (!Array.isArray(payload.blocks) || payload.blocks.length === 0 || payload.blocks.length > 8) {
      return NextResponse.json({ error: "Select between 1 and 8 planned blocks." }, { status: 400 });
    }

    const blocks: Array<{ taskId: string; start: string; end: string }> = [];
    for (const block of payload.blocks) {
      if (
        typeof block?.taskId !== "string" ||
        block.taskId.length === 0 ||
        block.taskId.length > 200 ||
        !validIso(block.start) ||
        !validIso(block.end) ||
        Date.parse(block.end) <= Date.parse(block.start)
      ) {
        return NextResponse.json({ error: "One or more plan blocks are invalid." }, { status: 400 });
      }
      blocks.push({ taskId: block.taskId, start: block.start, end: block.end });
    }

    // Ignore duplicate copies of the same block in a single request.
    const uniqueBlocks = [...new Map(
      blocks.map((block) => [focusEventId(block.taskId, block.start, block.end), block]),
    ).values()];

    const db = getAdminDb();
    const taskIds = [...new Set(uniqueBlocks.map((block) => block.taskId))];
    const taskRefs = taskIds.map((id) => db.collection("tasks").doc(id));
    const eventRefs = uniqueBlocks.map((block) =>
      db.collection("events").doc(focusEventId(block.taskId, block.start, block.end)),
    );

    const result = await db.runTransaction(async (transaction) => {
      const taskSnapshots = await Promise.all(taskRefs.map((ref) => transaction.get(ref)));
      const taskTitles = new Map<string, string>();
      taskSnapshots.forEach((task, index) => {
        const data = task.data();
        if (!task.exists || data?.userId !== userId || data?.completed) {
          throw new Error("One or more selected tasks are unavailable.");
        }
        taskTitles.set(taskIds[index], String(data.title || "Task"));
      });

      const eventSnapshots = await Promise.all(eventRefs.map((ref) => transaction.get(ref)));
      let createdBlocks = 0;
      let skippedExisting = 0;
      uniqueBlocks.forEach((block, index) => {
        if (eventSnapshots[index].exists) {
          skippedExisting += 1;
          return;
        }
        transaction.create(eventRefs[index], {
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
        createdBlocks += 1;
      });
      return { createdBlocks, skippedExisting };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply plan.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401
      : message.includes("unavailable") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
