"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, tasksApi } from "@/lib/api-client";
import type { Task } from "@/lib/tasks";
import TaskForm from "./TaskForm";
import TaskItem from "./TaskItem";

type Filter = "all" | "active" | "completed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

/** Open tasks first, then newest first — the same order the API returns. */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      b.created_at.localeCompare(a.created_at) ||
      b.id - a.id,
  );
}

export default function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setTasks(await tasksApi.list());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const describe = (err: unknown) =>
    err instanceof ApiError ? err.message : "Something went wrong. Please try again.";

  const addTask = async (title: string, description: string) => {
    const created = await tasksApi.create({ title, description });
    setTasks((current) => sortTasks([created, ...current]));
    setNotice(null);
  };

  const saveTask = async (id: number, title: string, description: string) => {
    const updated = await tasksApi.update(id, { title, description });
    setTasks((current) => sortTasks(current.map((t) => (t.id === id ? updated : t))));
    setNotice(null);
  };

  // Toggle and delete update the UI immediately and roll back if the API call fails.
  const toggleTask = async (task: Task) => {
    const previous = tasks;
    setTasks((current) =>
      sortTasks(current.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))),
    );
    try {
      const updated = await tasksApi.update(task.id, { completed: !task.completed });
      setTasks((current) => sortTasks(current.map((t) => (t.id === task.id ? updated : t))));
      setNotice(null);
    } catch (err) {
      setTasks(previous);
      setNotice(describe(err));
    }
  };

  const deleteTask = async (task: Task) => {
    const previous = tasks;
    setTasks((current) => current.filter((t) => t.id !== task.id));
    try {
      await tasksApi.remove(task.id);
      setNotice(null);
    } catch (err) {
      // A 404 means it is already gone, which is what the user wanted.
      if (err instanceof ApiError && err.status === 404) return;
      setTasks(previous);
      setNotice(describe(err));
    }
  };

  const counts = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    return { all: tasks.length, completed, active: tasks.length - completed };
  }, [tasks]);

  const visible = useMemo(
    () =>
      tasks.filter((t) =>
        filter === "all" ? true : filter === "completed" ? t.completed : !t.completed,
      ),
    [tasks, filter],
  );

  return (
    <section className="card tasks" aria-labelledby="tasks-heading">
      <div className="card-head">
        <h2 id="tasks-heading">My tasks</h2>
        {status === "ready" && (
          <span className="muted">
            {counts.completed} of {counts.all} done
          </span>
        )}
      </div>

      <TaskForm mode="create" onSubmit={addTask} />

      <div className="filters" role="group" aria-label="Filter tasks">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label} <span className="chip-count">{counts[value]}</span>
          </button>
        ))}
      </div>

      {notice && (
        <p className="alert" role="alert">
          {notice}
        </p>
      )}

      {status === "loading" && <p className="state">Loading tasks…</p>}

      {status === "error" && (
        <div className="state">
          <p>Could not load your tasks.</p>
          <button type="button" className="btn" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {status === "ready" && visible.length === 0 && (
        <p className="state">
          {counts.all === 0
            ? "No tasks yet. Add your first one above."
            : filter === "active"
              ? "Nothing left to do. Nice work."
              : "No completed tasks yet."}
        </p>
      )}

      {status === "ready" && visible.length > 0 && (
        <ul className="task-list">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onSave={saveTask}
              onDelete={deleteTask}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
