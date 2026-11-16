import type { TaskInput } from "./tasks";

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;

export type ValidationResult =
  | { ok: true; data: TaskInput }
  | { ok: false; errors: Record<string, string> };

/**
 * Validates a task payload. With `partial: true` (updates) every field is
 * optional, but at least one must be present.
 */
export function validateTask(body: unknown, { partial }: { partial: boolean }): ValidationResult {
  const errors: Record<string, string> = {};
  const data: TaskInput = {};

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: { body: "Request body must be a JSON object." } };
  }
  const { title, description, completed } = body as Record<string, unknown>;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      errors.title = "Title is required.";
    } else if (title.trim().length > TITLE_MAX) {
      errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
    } else {
      data.title = title.trim();
    }
  } else if (!partial) {
    errors.title = "Title is required.";
  }

  if (description !== undefined) {
    if (typeof description !== "string") {
      errors.description = "Description must be text.";
    } else if (description.trim().length > DESCRIPTION_MAX) {
      errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
    } else {
      data.description = description.trim();
    }
  }

  if (completed !== undefined) {
    if (typeof completed !== "boolean") {
      errors.completed = "Completed must be true or false.";
    } else {
      data.completed = completed;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (partial && Object.keys(data).length === 0) {
    return { ok: false, errors: { body: "Send at least one of: title, description, completed." } };
  }
  return { ok: true, data };
}

/** Parses a route id; returns null unless it is a positive 32-bit integer. */
export function parseId(raw: string): number | null {
  if (!/^\d{1,10}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && id <= 2147483647 ? id : null;
}
