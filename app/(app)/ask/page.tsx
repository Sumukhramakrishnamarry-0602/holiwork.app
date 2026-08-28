"use client";

import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { saveConversation, subscribeConversation, clearConversation } from "@/lib/services/aiConversations";
import { subscribeEvents } from "@/lib/services/events";
import { subscribeReminders } from "@/lib/services/reminders";
import { subscribeTasks } from "@/lib/services/tasks";
import type { CalendarEvent, ChatMessage, ReminderItem, TaskItem } from "@/lib/types";
import { currentTimezone } from "@/lib/utils/date";
import { useEffect, useState } from "react";

export default function AskPage() {
  const { user } = useAuthUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubs = [
      subscribeConversation(user.uid, setMessages, setError),
      subscribeTasks(user.uid, setTasks, setError),
      subscribeEvents(user.uid, setEvents, setError),
      subscribeReminders(user.uid, setReminders, setError),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  async function addMessage(message: ChatMessage) {
    if (!user) return;
    setMessages((previous) => {
      const updated = [...previous, message];
      void saveConversation(user.uid, updated);
      return updated;
    });
  }

  async function runAction(action: { type: string; payload?: Record<string, string> }) {
    if (!user || !action.payload) return;

    await aiService.executeAction({
      type: action.type as "createTask" | "createEvent" | "createReminder",
      payload: action.payload as never,
    });
  }

  async function clearAll() {
    if (!user) return;
    setMessages([]);
    await clearConversation(user.uid);
  }

  return (
    <div className="content">
      {error && <p className="status error">{error}</p>}
      <AssistantPanel
        messages={messages}
        context={{
          nowIso: new Date().toISOString(),
          timezone: currentTimezone(),
          tasks,
          events,
          reminders,
        }}
        onSendMessage={addMessage}
        onReceiveMessage={addMessage}
        onAction={runAction}
        onClear={clearAll}
      />
    </div>
  );
}
