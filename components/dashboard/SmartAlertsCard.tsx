"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarEvent, ReminderItem, TaskItem } from "@/lib/types";
import { toLocalLabel } from "@/lib/utils/date";

type AlertItem = {
  id: string;
  title: string;
  time: number;
  href: string;
  kind: "Overdue" | "Due soon" | "Upcoming";
  detail: string;
};

export function SmartAlertsCard({
  tasks,
  reminders,
  events,
}: {
  tasks: TaskItem[];
  reminders: ReminderItem[];
  events: CalendarEvent[];
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const alerts = useMemo(() => {
    const soonLimit = now + 24 * 60 * 60 * 1000;
    const items: AlertItem[] = [];

    for (const task of tasks) {
      if (task.completed || !task.dueDate) continue;
      const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`).getTime();
      if (!Number.isFinite(due)) continue;
      if (due <= now) {
        items.push({ id: `task-${task.id}`, title: task.title, time: due, href: "/tasks", kind: "Overdue", detail: "Task deadline passed" });
      } else if (due <= soonLimit) {
        items.push({ id: `task-${task.id}`, title: task.title, time: due, href: "/tasks", kind: "Due soon", detail: "Task deadline within 24 hours" });
      }
    }

    for (const reminder of reminders) {
      if (reminder.completed) continue;
      const due = new Date(reminder.reminderTime).getTime();
      if (!Number.isFinite(due)) continue;
      if (due <= now) {
        items.push({ id: `reminder-${reminder.id}`, title: reminder.title, time: due, href: "/reminders", kind: "Overdue", detail: "Reminder is ready" });
      } else if (due <= soonLimit) {
        items.push({ id: `reminder-${reminder.id}`, title: reminder.title, time: due, href: "/reminders", kind: "Due soon", detail: "Reminder within 24 hours" });
      }
    }

    for (const event of events) {
      const start = new Date(event.startTime).getTime();
      if (Number.isFinite(start) && start >= now && start <= now + 2 * 60 * 60 * 1000) {
        items.push({ id: `event-${event.id}`, title: event.title, time: start, href: "/calendar", kind: "Upcoming", detail: "Event starting in the next 2 hours" });
      }
    }

    return items.sort((a, b) => a.time - b.time).slice(0, 6);
  }, [tasks, reminders, events, now]);

  return (
    <section className="card">
      <div className="row space-between">
        <h2>Smart alerts</h2>
        <span className="badge">{alerts.length} active</span>
      </div>
      <p className="status">A live overview of deadlines, reminders, and events that need your attention.</p>
      {alerts.length === 0 ? (
        <p className="status">You’re all caught up — no overdue items or time-sensitive alerts.</p>
      ) : (
        alerts.map((alert) => (
          <div className="event-item" key={alert.id}>
            <div className="row space-between">
              <strong>{alert.title}</strong>
              <span className="badge">{alert.kind}</span>
            </div>
            <p className="status">{alert.detail} · {toLocalLabel(new Date(alert.time).toISOString())}</p>
            <Link className="ghost-btn" href={alert.href}>View details</Link>
          </div>
        ))
      )}
      <p className="status">These are in-app alerts; browser push notifications and email delivery are not enabled yet.</p>
    </section>
  );
}
