import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

type ActionType =
  | "createTask"
  | "updateTask"
  | "completeTask"
  | "createEvent"
  | "updateEvent"
  | "createReminder"
  | "updateReminder";

const allowedTypes = new Set<ActionType>([
  "createTask",
  "updateTask",
  "completeTask",
  "createEvent",
  "updateEvent",
  "createReminder",
  "updateReminder",
]);

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function assertAction(type: unknown): asserts type is ActionType {
  if (typeof type !== "string" || !allowedTypes.has(type as ActionType)) {
    throw new Error("Unsupported AI action.");
  }
}

async function assertOwned(userId: string, collectionName: string, documentId: string) {
  if (!documentId || documentId.length > 200) throw new Error("Invalid document ID.");
  const snapshot = await getAdminDb().collection(collectionName).doc(documentId).get();
  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new Error("The requested item was not found.");
  }
}

export async function executeAIAction(
  userId: string,
  action: { type: unknown; payload?: Record<string, unknown> },
) {
  assertAction(action.type);
  const payload = action.payload || {};
  const db = getAdminDb();

  if (action.type === "createTask") {
    const title = text(payload.title);
    if (!title) throw new Error("Task title is required.");
    const priority = payload.priority === "High" || payload.priority === "Low" ? payload.priority : "Medium";

    await db.collection("tasks").add({
      userId,
      title: title.slice(0, 300),
      description: text(payload.description).slice(0, 2000),
      dueDate: text(payload.dueDate),
      dueTime: text(payload.dueTime),
      priority,
      category: text(payload.category, "General").slice(0, 100),
      completed: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { type: action.type, success: true };
  }

  if (action.type === "createEvent") {
    const title = text(payload.title);
    const startTime = text(payload.startTime);
    const endTime = text(payload.endTime);
    if (!title || !startTime || !endTime) throw new Error("Event title, start time, and end time are required.");

    await db.collection("events").add({
      userId,
      title: title.slice(0, 300),
      description: text(payload.description).slice(0, 2000),
      startTime,
      endTime,
      location: text(payload.location).slice(0, 300),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { type: action.type, success: true };
  }

  if (action.type === "createReminder") {
    const title = text(payload.title);
    const reminderTime = text(payload.reminderTime);
    if (!title || !reminderTime) throw new Error("Reminder title and time are required.");

    await db.collection("reminders").add({
      userId,
      title: title.slice(0, 300),
      description: text(payload.description).slice(0, 2000),
      reminderTime,
      completed: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { type: action.type, success: true };
  }

  const collectionName =
    action.type === "updateTask" || action.type === "completeTask"
      ? "tasks"
      : action.type === "updateEvent"
        ? "events"
        : "reminders";

  const id = text(payload.id);
  await assertOwned(userId, collectionName, id);

  if (action.type === "completeTask") {
    await db.collection(collectionName).doc(id).update({
      completed: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { type: action.type, success: true };
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (collectionName === "tasks") {
    if (payload.title !== undefined) updates.title = text(payload.title).slice(0, 300);
    if (payload.description !== undefined) updates.description = text(payload.description).slice(0, 2000);
    if (payload.dueDate !== undefined) updates.dueDate = text(payload.dueDate);
    if (payload.dueTime !== undefined) updates.dueTime = text(payload.dueTime);
    if (payload.category !== undefined) updates.category = text(payload.category).slice(0, 100);
    if (payload.priority === "Low" || payload.priority === "Medium" || payload.priority === "High") updates.priority = payload.priority;
  } else if (collectionName === "events") {
    if (payload.title !== undefined) updates.title = text(payload.title).slice(0, 300);
    if (payload.description !== undefined) updates.description = text(payload.description).slice(0, 2000);
    if (payload.startTime !== undefined) updates.startTime = text(payload.startTime);
    if (payload.endTime !== undefined) updates.endTime = text(payload.endTime);
    if (payload.location !== undefined) updates.location = text(payload.location).slice(0, 300);
  } else {
    if (payload.title !== undefined) updates.title = text(payload.title).slice(0, 300);
    if (payload.description !== undefined) updates.description = text(payload.description).slice(0, 2000);
    if (payload.reminderTime !== undefined) updates.reminderTime = text(payload.reminderTime);
    if (payload.completed !== undefined) updates.completed = Boolean(payload.completed);
  }

  await db.collection(collectionName).doc(id).update(updates);
  return { type: action.type, success: true };
}
