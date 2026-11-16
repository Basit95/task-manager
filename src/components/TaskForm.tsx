"use client";

import { useId, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/validation";

interface Props {
  mode: "create" | "edit";
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel?: () => void;
}

/** Shared form for adding a task and for editing one inline. */
export default function TaskForm({
  mode,
  initialTitle = "",
  initialDescription = "",
  onSubmit,
  onCancel,
}: Props) {
  const id = useId();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim(), description.trim());
      if (mode === "create") {
        setTitle("");
        setDescription("");
      }
    } catch (err) {
      const details = err instanceof ApiError ? err.details : undefined;
      setError(
        details
          ? Object.values(details).join(" ")
          : err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={`task-form task-form--${mode}`} onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-title`}>{mode === "create" ? "New task" : "Title"}</label>
        <input
          id={`${id}-title`}
          type="text"
          value={title}
          maxLength={TITLE_MAX}
          placeholder="What needs to be done?"
          autoFocus={mode === "edit"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-description`}>
          Details <span className="muted">(optional)</span>
        </label>
        <textarea
          id={`${id}-description`}
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX}
          placeholder="Add a note"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Add task" : "Save changes"}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
