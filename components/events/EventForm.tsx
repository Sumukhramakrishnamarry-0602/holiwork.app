"use client";

import type { CalendarEvent } from "@/lib/types";
import { FormEvent, useState } from "react";

interface EventFormProps {
  initial?: CalendarEvent;
  onSave: (input: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
  }) => Promise<void>;
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

export function EventForm({ initial, onSave, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [startTime, setStartTime] = useState(toDateTimeLocal(initial?.startTime || ""));
  const [endTime, setEndTime] = useState(toDateTimeLocal(initial?.endTime || ""));
  const [location, setLocation] = useState(initial?.location || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave({
        title,
        description,
        startTime: fromDateTimeLocal(startTime),
        endTime: fromDateTimeLocal(endTime),
        location,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Start
        <input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
      </label>
      <label>
        End
        <input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
      </label>
      <label>
        Location
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
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
