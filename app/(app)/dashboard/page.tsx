"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";
import { FocusNowCard } from "@/components/dashboard/FocusNowCard";
import { DayPlanCard } from "@/components/dashboard/DayPlanCard";
import { EventForm } from "@/components/events/EventForm";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { aiService } from "@/lib/ai/service";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createEvent, subscribeEvents } from "@/lib/services/events";
import { createReminder, subscribeReminders } from "@/lib/services/reminders";
import { createTask, subscribeTasks, updateTask } from "@/lib/services/tasks";
import type { CalendarEvent, ReminderItem, TaskItem } from "@/lib/types";
import { getFocusRecommendation } from "@/lib/productivity/focus";
import { buildDayPlan } from "@/lib/productivity/planner";
import { currentTimezone, getGreeting, sortEventsByStart, sortTasksByDue, toLocalLabel } from "@/lib/utils/date";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState("Loading your AI daily brief...");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openEventModal, setOpenEventModal] = useState(false);
  const [openReminderModal, setOpenReminderModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubTasks = subscribeTasks(user.uid, setTasks, setError);
    const unsubEvents = subscribeEvents(user.uid, setEvents, setError);
    const unsubReminders = subscribeReminders(user.uid, setReminders, setError);

    return () => {
      unsubTasks();
      unsubEvents();
      unsubReminders();
    };
  }, [user]);

  const upcoming = useMemo(() => {
    const taskItems = tasks
      .filter((task) => !task.completed && task.dueDate)
      .map((task) => ({
        type: "task" as const,
        id: task.id,
        title: task.title,
        time: new Date(`${task.dueDate}T${task.dueTime || "23:59"}`).toISOString(),
      }));

    const eventItems = events.map((event) => ({
      type: "event" as const,
      id: event.id,
      title: event.title,
      time: event.startTime,
    }));

    return [...taskItems, ...eventItems]
      .filter((item) => new Date(item.time).getTime() >= Date.now())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(0, 6);
  }, [events, tasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const focusRecommendation = useMemo(() => getFocusRecommendation(tasks, events), [tasks, events]);
  const dayPlan = useMemo(() => buildDayPlan(tasks, events), [tasks, events]);

  async function refreshBrief() {
    if (!user) return;
    setBriefLoading(true);
    setBriefError(null);

    try {
      const response = await aiService.generateDailyBrief({
        context: {
          nowIso: new Date().toISOString(),
          timezone: currentTimezone(),
          tasks: sortTasksByDue(tasks),
          events: sortEventsByStart(events),
          reminders,
        },
      });

      setBrief(response.brief);
    } catch (refreshError) {
      setBriefError(refreshError instanceof Error ? refreshError.message : "Failed to generate daily brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  useEffect(() => {
    if (tasks.length || events.length || reminders.length) {
      void refreshBrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, events.length, reminders.length]);

  return (
    <div className="content">
      <header className="card">
        <h1>{getGreeting(user?.displayName || user?.email?.split("@")[0] || "there")}</h1>
        <p>Here&apos;s what you need to focus on today.</p>
      </header>

      <DailyBriefCard brief={brief} loading={briefLoading} error={briefError} onRefresh={refreshBrief} />

      <FocusNowCard recommendation={focusRecommendation} />

      <DayPlanCard blocks={dayPlan} />

      {error && <p className="status error">{error}</p>}

      <section className="grid-2">
        <div className="card">
          <div className="row space-between">
            <h2>Today&apos;s Tasks</h2>
            <button className="secondary-btn" onClick={() => setOpenTaskModal(true)}>
              + Task
            </button>
          </div>
          <p className="status">
            {completedCount} of {tasks.length} tasks completed
          </p>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet." description="Add something you want to get done." />
          ) : (
            sortTasksByDue(tasks)
              .slice(0, 6)
              .map((task) => (
                <div className="task-item" key={task.id}>
                  <div className="row space-between">
                    <strong>{task.title}</strong>
                    <span className="badge">{task.priority}</span>
                  </div>
                  <p>{task.description}</p>
                  <p className="status">Due: {task.dueDate || "No due date"} {task.dueTime}</p>
                  <div className="row">
                    <button className="secondary-btn" onClick={() => updateTask(task.id, { completed: !task.completed })}>
                      {task.completed ? "Mark pending" : "Complete"}
                    </button>
                    <Link className="ghost-btn" href="/tasks">
                      Open/edit
                    </Link>
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="card">
          <h2>Upcoming</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Your schedule is clear." description="No upcoming events or deadlines right now." />
          ) : (
            upcoming.map((item) => (
              <div className="event-item" key={`${item.type}-${item.id}`}>
                <div className="row space-between">
                  <strong>{item.title}</strong>
                  <span className="badge">{item.type}</span>
                </div>
                <p className="status">{toLocalLabel(item.time)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <h2>Quick Actions</h2>
        <div className="row">
          <button className="primary-btn" onClick={() => setOpenTaskModal(true)}>
            + Task
          </button>
          <button className="secondary-btn" onClick={() => setOpenEventModal(true)}>
            + Event
          </button>
          <Link href="/ask" className="secondary-btn">
            Ask Holiwork
          </Link>
          <button className="ghost-btn" onClick={() => setOpenReminderModal(true)}>
            + Reminder
          </button>
        </div>
      </section>

      <Modal open={openTaskModal} title="Create task" onClose={() => setOpenTaskModal(false)}>
        <TaskForm
          onCancel={() => setOpenTaskModal(false)}
          onSave={async (input) => {
            if (!user) return;
            await createTask(user.uid, input);
            setOpenTaskModal(false);
          }}
        />
      </Modal>

      <Modal open={openEventModal} title="Create event" onClose={() => setOpenEventModal(false)}>
        <EventForm
          onCancel={() => setOpenEventModal(false)}
          onSave={async (input) => {
            if (!user) return;
            await createEvent(user.uid, input);
            setOpenEventModal(false);
          }}
        />
      </Modal>

      <Modal open={openReminderModal} title="Create reminder" onClose={() => setOpenReminderModal(false)}>
        <ReminderForm
          onCancel={() => setOpenReminderModal(false)}
          onSave={async (input) => {
            if (!user) return;
            await createReminder(user.uid, input);
            setOpenReminderModal(false);
          }}
        />
      </Modal>
    </div>
  );
}
