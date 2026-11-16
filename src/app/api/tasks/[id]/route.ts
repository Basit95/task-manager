import { NextResponse } from "next/server";
import { handle, jsonError, readJson } from "@/lib/http";
import { deleteTask, getTask, updateTask } from "@/lib/tasks";
import { parseId, validateTask } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// GET /api/tasks/:id — fetch one task
export const GET = handle(async (_request: Request, { params }: Context) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError(400, "Task id must be a positive integer.");

  const task = await getTask(id);
  return task ? NextResponse.json({ data: task }) : jsonError(404, "Task not found.");
});

// PUT/PATCH /api/tasks/:id — update title, description and/or completed
const update = handle(async (request: Request, { params }: Context) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError(400, "Task id must be a positive integer.");

  const result = validateTask(await readJson(request), { partial: true });
  if (!result.ok) return jsonError(422, "Validation failed.", result.errors);

  const task = await updateTask(id, result.data);
  return task ? NextResponse.json({ data: task }) : jsonError(404, "Task not found.");
});
export const PUT = update;
export const PATCH = update;

// DELETE /api/tasks/:id — remove a task
export const DELETE = handle(async (_request: Request, { params }: Context) => {
  const id = parseId((await params).id);
  if (id === null) return jsonError(400, "Task id must be a positive integer.");

  return (await deleteTask(id))
    ? new NextResponse(null, { status: 204 })
    : jsonError(404, "Task not found.");
});
