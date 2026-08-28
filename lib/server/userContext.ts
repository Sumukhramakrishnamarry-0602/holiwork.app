import { getAdminDb } from "@/lib/server/firebaseAdmin";
import type { AssistantContext, CalendarEvent, ReminderItem, TaskItem } from "@/lib/types";
import { collection, getDocs, query, where } from "firebase-admin/firestore";

function toIso(value: unknown) {
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : undefined;
}

export async function getUserAssistantContext(
  userId: string,
  nowIso = new Date().toISOString(),
  timezone = "UTC",
): Promise<AssistantContext> {
  const db = getAdminDb();

  const [taskSnapshot, eventSnapshot, reminderSnapshot] = await Promise.all([
    getDocs(query(collection(db, "tasks"), where("userId", "==", userId))),
    getDocs(query(collection(db, "events"), where("userId", "==", userId))),
    getDocs(query(collection(db, "reminders"), where("userId", "==", userId))),
  ]);

  const tasks = taskSnapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      userId,
      title: String(data.title || ""),
      description: String(data.description || ""),
      completed: Boolean(data.completed),
      priority: data.priority === "High" || data.priority === "Low" ? data.priority : "Medium",
      dueDate: String(data.dueDate || ""),
      dueTime: String(data.dueTime || ""),
      category: String(data.category || "General"),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    } satisfies TaskItem;
  });

  const events = eventSnapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      userId,
      title: String(data.title || ""),
      description: String(data.description || ""),
      startTime: String(data.startTime || ""),
      endTime: String(data.endTime || ""),
      location: String(data.location || ""),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    } satisfies CalendarEvent;
  });

  const reminders = reminderSnapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      userId,
      title: String(data.title || ""),
      description: String(data.description || ""),
      reminderTime: String(data.reminderTime || ""),
      completed: Boolean(data.completed),
      createdAt: toIso(data.createdAt),
    } satisfies ReminderItem;
  });

  return { nowIso, timezone, tasks, events, reminders };
}
