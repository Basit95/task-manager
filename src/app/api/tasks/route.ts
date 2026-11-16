import { NextResponse } from "next/server";
import { handle, jsonError, readJson } from "@/lib/http";
import { createTask, listTasks } from "@/lib/tasks";
import { validateTask } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/tasks — list all tasks
export const GET = handle(async () => {
  return NextResponse.json({ data: await listTasks() });
});

// POST /api/tasks — create a task
export const POST = handle(async (request: Request) => {
  const result = validateTask(await readJson(request), { partial: false });
  if (!result.ok) return jsonError(422, "Validation failed.", result.errors);

  const task = await createTask({ ...result.data, title: result.data.title! });
  return NextResponse.json(
    { data: task },
    { status: 201, headers: { Location: `/api/tasks/${task.id}` } },
  );
});
