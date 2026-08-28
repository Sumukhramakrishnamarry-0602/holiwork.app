import { getFirebaseDb } from "@/lib/firebase/client";
import type { ReminderItem } from "@/lib/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const collectionName = "reminders";

function reminderCollection() {
  return collection(getFirebaseDb(), collectionName);
}

export interface ReminderInput {
  title: string;
  description: string;
  reminderTime: string;
  completed: boolean;
}

export function subscribeReminders(
  userId: string,
  onData: (reminders: ReminderItem[]) => void,
  onError: (error: string) => void,
) {
  const q = query(reminderCollection(), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const reminders = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          userId: data.userId,
          title: data.title,
          description: data.description || "",
          reminderTime: data.reminderTime,
          completed: Boolean(data.completed),
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
        } satisfies ReminderItem;
      });
      onData(reminders);
    },
    (error) => onError(error.message),
  );
}

export async function createReminder(userId: string, input: ReminderInput) {
  await addDoc(reminderCollection(), {
    userId,
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function updateReminder(reminderId: string, input: Partial<ReminderInput>) {
  await updateDoc(doc(getFirebaseDb(), collectionName, reminderId), input);
}

export async function deleteReminder(reminderId: string) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, reminderId));
}
