"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks";
import TaskForm from "./TaskForm";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onSave: (id: number, title: string, description: string) => Promise<void>;
  onDelete: (task: Task) => void;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export default function TaskItem({ task, onToggle, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <li className="task task--editing">
        <TaskForm
          mode="edit"
          initialTitle={task.title}
          initialDescription={task.description}
          onSubmit={async (title, description) => {
            await onSave(task.id, title, description);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`task${task.completed ? " task--done" : ""}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not completed" : "completed"}`}
      />
      <div className="task-body">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-desc">{task.description}</p>}
        <p className="task-meta">Added {dateFormat.format(new Date(task.created_at))}</p>
      </div>
      <div className="task-actions">
        {confirming ? (
          <>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(task)}>
              Delete
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setEditing(true)}
              aria-label={`Edit "${task.title}"`}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setConfirming(true)}
              aria-label={`Delete "${task.title}"`}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
