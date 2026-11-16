-- Task Manager schema (PostgreSQL)
-- Applied automatically on first request; safe to run repeatedly.

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(200) NOT NULL CHECK (char_length(btrim(title)) > 0),
  description TEXT         NOT NULL DEFAULT '',
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- The list view shows open tasks first, newest first.
CREATE INDEX IF NOT EXISTS idx_tasks_completed_created
  ON tasks (completed, created_at DESC);
