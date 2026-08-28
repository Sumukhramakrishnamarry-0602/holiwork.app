"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { EventForm } from "@/components/events/EventForm";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createEvent, deleteEvent, subscribeEvents, updateEvent } from "@/lib/services/events";
import type { CalendarEvent } from "@/lib/types";
import { sortEventsByStart, toLocalLabel } from "@/lib/utils/date";
import { useEffect, useMemo, useState } from "react";

type CalendarView = "Month" | "Week" | "Day";

function periodBounds(view: CalendarView, date: Date) {
  const base = new Date(date);
  if (view === "Day") {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (view === "Week") {
    const day = base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default function CalendarPage() {
  const { user } = useAuthUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("Month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [openCreate, setOpenCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeEvents(user.uid, setEvents, setError);
  }, [user]);

  const visibleEvents = useMemo(() => {
    const anchor = new Date(selectedDate);
    const { start, end } = periodBounds(view, anchor);
    return sortEventsByStart(events).filter((event) => {
      const startTime = new Date(event.startTime).getTime();
      return startTime >= start.getTime() && startTime <= end.getTime();
    });
  }, [events, selectedDate, view]);

  return (
    <div className="content">
      <section className="card">
        <div className="row space-between">
          <h1>Calendar</h1>
          <button className="primary-btn" onClick={() => setOpenCreate(true)}>
            + Event
          </button>
        </div>

        <div className="row">
          {(["Month", "Week", "Day"] as CalendarView[]).map((entry) => (
            <button
              key={entry}
              className={view === entry ? "primary-btn" : "ghost-btn"}
              onClick={() => setView(entry)}
            >
              {entry}
            </button>
          ))}
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </div>

        {error && <p className="status error">{error}</p>}
      </section>

      <section className="card">
        {visibleEvents.length === 0 ? (
          <EmptyState title="Your schedule is clear." description="Create an event to start planning your time." />
        ) : (
          visibleEvents.map((event) => (
            <div className="event-item" key={event.id}>
              <div className="row space-between">
                <strong>{event.title}</strong>
                <span className="badge">{view}</span>
              </div>
              {event.description && <p>{event.description}</p>}
              <p className="status">
                {toLocalLabel(event.startTime)} → {toLocalLabel(event.endTime)}
              </p>
              {event.location && <p className="status">Location: {event.location}</p>}
              <div className="row">
                <button className="ghost-btn" onClick={() => setEditingEvent(event)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => deleteEvent(event.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal open={openCreate} title="Create event" onClose={() => setOpenCreate(false)}>
        <EventForm
          onCancel={() => setOpenCreate(false)}
          onSave={async (input) => {
            if (!user) return;
            await createEvent(user.uid, input);
            setOpenCreate(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editingEvent)} title="Edit event" onClose={() => setEditingEvent(null)}>
        {editingEvent && (
          <EventForm
            initial={editingEvent}
            onCancel={() => setEditingEvent(null)}
            onSave={async (input) => {
              await updateEvent(editingEvent.id, input);
              setEditingEvent(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
