import { getFirebaseDb } from "@/lib/firebase/client";
import type { TaskItem, TaskPriority } from "@/lib/types";
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

const collectionName = "tasks";

function taskCollection() {
  return collection(getFirebaseDb(), collectionName);
}

export interface TaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  category: string;
}

export function subscribeTasks(userId: string, onData: (tasks: TaskItem[]) => void, onError: (error: string) => void) {
  const q = query(taskCollection(), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          userId: data.userId,
          title: data.title,
          description: data.description || "",
          completed: Boolean(data.completed),
          priority: (data.priority as TaskPriority) || "Medium",
          dueDate: data.dueDate || "",
          dueTime: data.dueTime || "",
          category: data.category || "General",
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } satisfies TaskItem;
      });
      onData(tasks);
    },
    (error) => onError(error.message),
  );
}

export async function createTask(userId: string, input: TaskInput) {
  await addDoc(taskCollection(), {
    userId,
    ...input,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(taskId: string, input: Partial<TaskInput & { completed: boolean }>) {
  await updateDoc(doc(getFirebaseDb(), collectionName, taskId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, taskId));
}
