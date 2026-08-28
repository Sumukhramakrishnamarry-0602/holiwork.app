"use client";

import { aiService } from "@/lib/ai/service";
import type { AssistantContext, ChatMessage } from "@/lib/types";
import { useState } from "react";

interface AssistantPanelProps {
  messages: ChatMessage[];
  context: AssistantContext;
  onSendMessage: (message: ChatMessage) => Promise<void>;
  onReceiveMessage: (message: ChatMessage) => Promise<void>;
  onAction: (action: { type: string; payload?: Record<string, string> }) => Promise<void>;
  onClear: () => Promise<void>;
}

export function AssistantPanel({ messages, context, onSendMessage, onReceiveMessage, onAction, onClear }: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setInput("");
    setLoading(true);
    setError(null);

    try {
      await onSendMessage(userMessage);
      const nextMessages = [...messages, userMessage];
      const reply = await aiService.chat({ messages: nextMessages, context });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply.message,
        createdAt: new Date().toISOString(),
      };

      await onReceiveMessage(assistantMessage);

      if (reply.action && reply.action.type !== "none") {
        await onAction(reply.action);
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card assistant-wrap">
      <div className="row space-between">
        <h2>Ask Holiwork</h2>
        <button className="ghost-btn" onClick={onClear}>
          Clear conversation
        </button>
      </div>

      <div className="chat-log">
        {messages.length === 0 ? (
          <p className="empty-title">Ask Holiwork anything about your day.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "bubble user" : "bubble assistant"}>
              <p>{message.content}</p>
            </div>
          ))
        )}
      </div>

      {error && <p className="status error">{error}</p>}
      {loading && <p className="status">Holiwork is thinking…</p>}

      <div className="row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="What do I need to focus on first?"
          className="grow"
        />
        <button className="primary-btn" onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </section>
  );
}
