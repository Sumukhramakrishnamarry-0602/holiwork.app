import { getFirebaseDb } from "@/lib/firebase/client";
import type { CalendarEvent } from "@/lib/types";
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

const collectionName = "events";

function eventCollection() {
  return collection(getFirebaseDb(), collectionName);
}

export interface EventInput {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

export function subscribeEvents(
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError: (error: string) => void,
) {
  const q = query(eventCollection(), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          userId: data.userId,
          title: data.title,
          description: data.description || "",
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location || "",
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } satisfies CalendarEvent;
      });
      onData(events);
    },
    (error) => onError(error.message),
  );
}

export async function createEvent(userId: string, input: EventInput) {
  await addDoc(eventCollection(), {
    userId,
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEvent(eventId: string, input: Partial<EventInput>) {
  await updateDoc(doc(getFirebaseDb(), collectionName, eventId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(getFirebaseDb(), collectionName, eventId));
}
