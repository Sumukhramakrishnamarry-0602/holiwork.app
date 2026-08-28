"use client";

import { Modal } from "@/components/common/Modal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { aiService } from "@/lib/ai/service";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createTask } from "@/lib/services/tasks";
import type { TaskPriority } from "@/lib/types";
import { useState } from "react";

type ExtractedTask = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
};

export function QuickCapture({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuthUser();
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function understand() {
    if (!text.trim() || !user) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await aiService.extractTask({
        text: text.trim(),
        nowIso: now.toISOString(),
        timezone,
      });
      setExtracted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not understand that.");
    } finally {
      setLoading(false);
    }
  }

  async function save(task: ExtractedTask) {
    if (!user) return;
    await createTask(user.uid, task);
    setText("");
    setExtracted(null);
    onCreated?.();
  }

  return (
    <>
      <section className="card">
        <p className="status">Quick capture</p>
        <h2>Tell Holiwork what you need to do.</h2>
        <div className="row">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void understand();
            }}
            placeholder="e.g. Finish Java assignment tomorrow at 6 PM"
            aria-label="Quick capture task"
          />
          <button className="primary-btn" onClick={() => void understand()} disabled={loading || !text.trim()}>
            {loading ? "Understanding..." : "Capture"}
          </button>
        </div>
        {error && <p className="status error">{error}</p>}
      </section>

      <Modal open={Boolean(extracted)} title="Review task" onClose={() => setExtracted(null)}>
        {extracted && (
          <TaskForm
            initial={{
              id: "preview",
              userId: user?.uid || "",
              completed: false,
              createdAt: undefined,
              updatedAt: undefined,
              ...extracted,
            }}
            onCancel={() => setExtracted(null)}
            onSave={async (input) => {
              await save(input);
            }}
          />
        )}
      </Modal>
    </>
  );
}
