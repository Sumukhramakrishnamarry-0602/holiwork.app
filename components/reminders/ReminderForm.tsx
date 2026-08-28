"use client";

import { aiService } from "@/lib/ai/service";
import { currentTimezone } from "@/lib/utils/date";
import type { ReminderItem } from "@/lib/types";
import { FormEvent, useState } from "react";

interface ReminderFormProps {
  initial?: ReminderItem;
  onSave: (input: { title: string; description: string; reminderTime: string; completed: boolean }) => Promise<void>;
  onCancel: () => void;
}

function toDateTimeLocal(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function ReminderForm({ initial, onSave, onCancel }: ReminderFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [reminderTime, setReminderTime] = useState(toDateTimeLocal(initial?.reminderTime || ""));
  const [completed, setCompleted] = useState(initial?.completed || false);
  const [naturalText, setNaturalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parseNaturalLanguage() {
    if (!naturalText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const extracted = await aiService.extractReminder({
        text: naturalText,
        nowIso: new Date().toISOString(),
        timezone: currentTimezone(),
      });
      setTitle(extracted.title || title);
      setDescription(extracted.description || description);
      setReminderTime(toDateTimeLocal(extracted.reminderTime) || reminderTime);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Failed to parse reminder text.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave({ title, description, reminderTime: fromDateTimeLocal(reminderTime), completed });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save reminder.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Natural language
        <textarea
          value={naturalText}
          onChange={(event) => setNaturalText(event.target.value)}
          placeholder='e.g. "Remind me to call Mom at 8 PM"'
        />
      </label>
      <button className="secondary-btn" type="button" onClick={parseNaturalLanguage} disabled={loading}>
        Parse with AI
      </button>

      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Reminder time
        <input type="datetime-local" value={reminderTime} onChange={(event) => setReminderTime(event.target.value)} required />
      </label>
      <label className="checkbox-row">
        <input type="checkbox" checked={completed} onChange={(event) => setCompleted(event.target.checked)} />
        Completed
      </label>

      {error && <p className="status error">{error}</p>}

      <div className="row">
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button className="ghost-btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
