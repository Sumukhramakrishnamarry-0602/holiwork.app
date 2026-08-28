"use client";

import { aiService } from "@/lib/ai/service";
import { currentTimezone } from "@/lib/utils/date";
import type { TaskItem, TaskPriority } from "@/lib/types";
import { FormEvent, useState } from "react";

interface TaskFormProps {
  initial?: TaskItem;
  onSave: (input: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    category: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority || "Medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [dueTime, setDueTime] = useState(initial?.dueTime || "");
  const [category, setCategory] = useState(initial?.category || "General");
  const [naturalText, setNaturalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExtract() {
    if (!naturalText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const extracted = await aiService.extractTask({
        text: naturalText,
        nowIso: new Date().toISOString(),
        timezone: currentTimezone(),
      });
      setTitle(extracted.title || title);
      setDescription(extracted.description || description);
      setPriority(extracted.priority || "Medium");
      setDueDate(extracted.dueDate || dueDate);
      setDueTime(extracted.dueTime || dueTime);
      setCategory(extracted.category || category);
      setSuccess("Task details extracted.");
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Failed to extract task fields.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSave({ title, description, priority, dueDate, dueTime, category });
      setSuccess("Saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Natural language
        <textarea
          value={naturalText}
          onChange={(event) => setNaturalText(event.target.value)}
          placeholder='e.g. "Finish my Java assignment tomorrow at 6 PM"'
        />
      </label>
      <button type="button" className="secondary-btn" onClick={handleExtract} disabled={loading}>
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
        Priority
        <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
      <label>
        Due date
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>
      <label>
        Due time
        <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
      </label>
      <label>
        Category
        <input value={category} onChange={(event) => setCategory(event.target.value)} />
      </label>

      {error && <p className="status error">{error}</p>}
      {success && <p className="status success">{success}</p>}

      <div className="row">
        <button className="primary-btn" disabled={loading} type="submit">
          {loading ? "Saving..." : "Save"}
        </button>
        <button className="ghost-btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
