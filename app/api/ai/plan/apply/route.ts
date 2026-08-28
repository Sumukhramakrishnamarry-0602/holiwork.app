import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const payload = (await request.json()) as { taskIds?: unknown[] };
    if (!Array.isArray(payload.taskIds) || payload.taskIds.length === 0 || payload.taskIds.length > 5) {
      return NextResponse.json({ error: "Select between 1 and 5 tasks." }, { status: 400 });
    }

    const ids = [...new Set(payload.taskIds.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 200))];
    if (!ids.length) return NextResponse.json({ error: "No valid tasks selected." }, { status: 400 });

    const db = getAdminDb();
    const batch = db.batch();
    for (const id of ids) {
      const ref = db.collection("tasks").doc(id);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.data()?.userId !== userId || snapshot.data()?.completed) {
        return NextResponse.json({ error: "One or more selected tasks are unavailable." }, { status: 400 });
      }
      batch.update(ref, { updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
    return NextResponse.json({ success: true, taskIds: ids });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply plan.";
    const status = message.includes("Authentication") || message.includes("Invalid") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
