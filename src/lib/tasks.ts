import { query } from "./db";

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

const COLUMNS = "id, title, description, completed, created_at, updated_at";

// All queries are parameterised: user input never reaches the SQL string.

export function listTasks(): Promise<Task[]> {
  return query<Task>(
    `SELECT ${COLUMNS} FROM tasks ORDER BY completed ASC, created_at DESC, id DESC`,
  );
}

export async function getTask(id: number): Promise<Task | null> {
  const rows = await query<Task>(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createTask(input: TaskInput & { title: string }): Promise<Task> {
  const rows = await query<Task>(
    `INSERT INTO tasks (title, description, completed)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [input.title, input.description ?? "", input.completed ?? false],
  );
  return rows[0];
}

export async function updateTask(id: number, input: TaskInput): Promise<Task | null> {
  // COALESCE keeps the current value for any field the client did not send.
  const rows = await query<Task>(
    `UPDATE tasks
        SET title       = COALESCE($2::varchar, title),
            description = COALESCE($3::text, description),
            completed   = COALESCE($4::boolean, completed),
            updated_at  = now()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, input.title ?? null, input.description ?? null, input.completed ?? null],
  );
  return rows[0] ?? null;
}

export async function deleteTask(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM tasks WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
