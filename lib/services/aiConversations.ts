import { getFirebaseDb } from "@/lib/firebase/client";
import type { ChatMessage } from "@/lib/types";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

const collectionName = "aiConversations";

function conversationDoc(userId: string) {
  return doc(getFirebaseDb(), collectionName, userId);
}

export function subscribeConversation(
  userId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: string) => void,
) {
  return onSnapshot(
    conversationDoc(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const data = snapshot.data();
      const messages = Array.isArray(data.messages) ? (data.messages as ChatMessage[]) : [];
      onData(messages);
    },
    (error) => onError(error.message),
  );
}

export async function saveConversation(userId: string, messages: ChatMessage[]) {
  await setDoc(
    conversationDoc(userId),
    {
      userId,
      messages,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearConversation(userId: string) {
  await setDoc(
    conversationDoc(userId),
    {
      userId,
    messages: [],
    updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
