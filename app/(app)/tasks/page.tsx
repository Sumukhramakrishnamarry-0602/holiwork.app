"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createTask, deleteTask, subscribeTasks, updateTask } from "@/lib/services/tasks";
import type { TaskItem, TaskPriority } from "@/lib/types";
import { isFutureDateString, isTodayDateString, sortTasksByDue } from "@/lib/utils/date";
import { useEffect, useMemo, useState } from "react";

type TaskView = "All" | "Today" | "Upcoming" | "Completed";

export default function TasksPage() {
  const { user } = useAuthUser();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<TaskView>("All");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"All" | TaskPriority>("All");
  const [status, setStatus] = useState<"All" | "Pending" | "Completed">("All");
  const [category, setCategory] = useState("All");
  const [dueDate, setDueDate] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeTasks(user.uid, setTasks, setError);
  }, [user]);

  const categories = useMemo(() => {
    const unique = new Set(tasks.map((task) => task.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [tasks]);

  const filtered = useMemo(() => {
    return sortTasksByDue(tasks).filter((task) => {
      const inView =
        view === "All"
          ? true
          : view === "Today"
            ? !task.completed && isTodayDateString(task.dueDate)
            : view === "Upcoming"
              ? !task.completed && isFutureDateString(task.dueDate)
              : task.completed;

      const matchesSearch =
        !search.trim() ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());

      const matchesPriority = priority === "All" || task.priority === priority;
      const matchesStatus =
        status === "All" || (status === "Pending" ? !task.completed : task.completed);
      const matchesCategory = category === "All" || task.category === category;
      const matchesDueDate = !dueDate || task.dueDate === dueDate;

      return inView && matchesSearch && matchesPriority && matchesStatus && matchesCategory && matchesDueDate;
    });
  }, [category, dueDate, priority, search, status, tasks, view]);

  return (
    <div className="content">
      <section className="card">
        <div className="row space-between">
          <h1>Tasks</h1>
          <button className="primary-btn" onClick={() => setOpenCreate(true)}>
            + Task
          </button>
        </div>

        <div className="row">
          {(["All", "Today", "Upcoming", "Completed"] as TaskView[]).map((label) => (
            <button
              key={label}
              className={view === label ? "primary-btn" : "ghost-btn"}
              onClick={() => setView(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid-3">
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" />
          </label>
          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as "All" | TaskPriority)}>
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as "All" | "Pending" | "Completed")}>
              <option>All</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
        </div>

        {error && <p className="status error">{error}</p>}
      </section>

      <section className="card">
        <p className="status">
          {tasks.filter((task) => task.completed).length} of {tasks.length} tasks completed
        </p>

        {filtered.length === 0 ? (
          <EmptyState title="No tasks yet." description="Add something you want to get done." />
        ) : (
          filtered.map((task) => (
            <div className="task-item" key={task.id}>
              <div className="row space-between">
                <strong>{task.title}</strong>
                <span className="badge">{task.priority}</span>
              </div>
              {task.description && <p>{task.description}</p>}
              <p className="status">
                Due: {task.dueDate || "None"} {task.dueTime} · Category: {task.category}
              </p>

              <div className="row">
                <button className="secondary-btn" onClick={() => updateTask(task.id, { completed: !task.completed })}>
                  {task.completed ? "Mark pending" : "Complete"}
                </button>
                <button className="ghost-btn" onClick={() => setEditingTask(task)}>
                  Edit
                </button>
                <button className="danger-btn" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal open={openCreate} title="Create task" onClose={() => setOpenCreate(false)}>
        <TaskForm
          onCancel={() => setOpenCreate(false)}
          onSave={async (input) => {
            if (!user) return;
            await createTask(user.uid, input);
            setOpenCreate(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editingTask)} title="Edit task" onClose={() => setEditingTask(null)}>
        {editingTask && (
          <TaskForm
            initial={editingTask}
            onCancel={() => setEditingTask(null)}
            onSave={async (input) => {
              await updateTask(editingTask.id, input);
              setEditingTask(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
