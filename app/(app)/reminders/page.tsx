"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createReminder, deleteReminder, subscribeReminders, updateReminder } from "@/lib/services/reminders";
import type { ReminderItem } from "@/lib/types";
import { toLocalLabel } from "@/lib/utils/date";
import { useEffect, useState } from "react";

export default function RemindersPage() {
  const { user } = useAuthUser();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<ReminderItem | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeReminders(user.uid, setReminders, setError);
  }, [user]);

  return (
    <div className="content">
      <section className="card">
        <div className="row space-between">
          <h1>Reminders</h1>
          <button className="primary-btn" onClick={() => setOpenCreate(true)}>
            + Reminder
          </button>
        </div>
        <p className="status">Notification delivery infrastructure is not configured in this phase.</p>
        {error && <p className="status error">{error}</p>}
      </section>

      <section className="card">
        {reminders.length === 0 ? (
          <EmptyState title="No reminders yet." description="Create a reminder to stay on top of important follow-ups." />
        ) : (
          reminders.map((reminder) => (
            <div className="reminder-item" key={reminder.id}>
              <div className="row space-between">
                <strong>{reminder.title}</strong>
                <span className="badge">{reminder.completed ? "Done" : "Pending"}</span>
              </div>
              {reminder.description && <p>{reminder.description}</p>}
              <p className="status">{toLocalLabel(reminder.reminderTime)}</p>
              <div className="row">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    updateReminder(reminder.id, {
                      completed: !reminder.completed,
                    })
                  }
                >
                  {reminder.completed ? "Mark pending" : "Complete"}
                </button>
                <button className="ghost-btn" onClick={() => setEditing(reminder)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => deleteReminder(reminder.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal open={openCreate} title="Create reminder" onClose={() => setOpenCreate(false)}>
        <ReminderForm
          onCancel={() => setOpenCreate(false)}
          onSave={async (input) => {
            if (!user) return;
            await createReminder(user.uid, input);
            setOpenCreate(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit reminder" onClose={() => setEditing(null)}>
        {editing && (
          <ReminderForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={async (input) => {
              await updateReminder(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
