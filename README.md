# Task Manager

A simple task manager I built as a full-stack exercise. You can add tasks, edit them, delete them and tick them off. Everything is saved in PostgreSQL through a small REST API. I also added a weather box on the side that pulls live data from the Open-Meteo API.

![Screenshot of the app](docs/screenshot.png)

**Stack:** Next.js (App Router), React, TypeScript, PostgreSQL

## Running it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/Basit95/task-manager.git
cd task-manager
npm install
npm run dev
```

Then open http://localhost:3000.

You don't have to install a database to try it out. If `DATABASE_URL` is not set, the app falls back to PGlite (PostgreSQL running inside Node) and keeps the data in a `.data` folder. I did this so anyone reviewing the project can run it with two commands.

To use a real PostgreSQL server instead, copy `.env.example` to `.env.local` and put your connection string in it:

```
DATABASE_URL=postgres://user:password@localhost:5432/task_manager
```

The table gets created on the first request. If you prefer to create it yourself:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## Database schema

There is only one table. The file is [`db/schema.sql`](db/schema.sql).

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(200) NOT NULL CHECK (char_length(btrim(title)) > 0),
  description TEXT         NOT NULL DEFAULT '',
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_completed_created
  ON tasks (completed, created_at DESC);
```

A few notes on it:

- The `CHECK` on `title` stops blank titles at the database level, even if someone skips the API validation.
- `updated_at` is refreshed by the update query.
- The index is there because the list is sorted with open tasks first and newest on top.

## API

| Method | Endpoint | What it does |
| --- | --- | --- |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT / PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/weather?city=Karachi` | Weather for a city |

A task has a `title` (required, max 200 characters), an optional `description` and a `completed` flag. For updates you only send the fields you want to change, so marking a task done is just `{"completed": true}`.

Successful responses look like `{ "data": ... }`. Errors look like `{ "error": { "message": "...", "details": { ... } } }`, with 400 for a bad id, 404 when the task doesn't exist and 422 when validation fails.

Quick examples:

```bash
# create
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk and eggs"}'

# mark as done
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# delete
curl -X DELETE http://localhost:3000/api/tasks/1
```

## Weather integration (Open-Meteo)

For the public API part I used [Open-Meteo](https://open-meteo.com) because it is free and does not need an API key.

The browser never calls Open-Meteo directly. It calls my own endpoint, `/api/weather?city=...`, and the server does the rest:

1. It looks up the city with the Open-Meteo geocoding API to get the latitude and longitude.
2. It calls the forecast API with those coordinates to get the current weather and the next few days.
3. It converts the response into a smaller object, so the front end only gets what it shows. Open-Meteo returns numeric weather codes, and these are mapped to text like "Clear sky" on the server.

I went through the server so I could validate the input, cache the result for 10 minutes and return proper errors (404 if the city isn't found, 502/504 if Open-Meteo is down or too slow). On the front end, searching again cancels the previous request, and the last city you searched is remembered.

The code is in [`src/lib/weather.ts`](src/lib/weather.ts), [`src/app/api/weather/route.ts`](src/app/api/weather/route.ts) and [`src/components/WeatherWidget.tsx`](src/components/WeatherWidget.tsx).

## How the code is organised

```
db/schema.sql                    table definition
src/app/api/tasks/route.ts       list and create
src/app/api/tasks/[id]/route.ts  get, update, delete
src/app/api/weather/route.ts     weather endpoint
src/components/                  TaskApp, TaskForm, TaskItem, WeatherWidget
src/lib/db.ts                    database connection
src/lib/tasks.ts                 all the SQL queries
src/lib/validation.ts            input validation
src/lib/weather.ts               Open-Meteo calls
```

I kept the route files thin. They only deal with the request and response, the SQL lives in `tasks.ts`, and `db.ts` is the only file that knows which database driver is being used.

## Things I paid attention to

- All queries use parameters, so user input is never joined into the SQL string.
- Input is validated on the server, not only in the form.
- Error responses don't leak stack traces or database messages.
- Ticking and deleting a task update the UI straight away and are rolled back if the request fails.
- The layout works on phones, and the buttons and checkboxes are usable with a keyboard.

## What I would add with more time

- User accounts, so each person has their own list
- Tests for the API routes
- Due dates and drag-and-drop ordering

## Deploying

I would deploy this on Vercel with a hosted PostgreSQL database such as Neon or Supabase. Import the repo, add the `DATABASE_URL` environment variable and deploy. A real database is needed in production because the local PGlite fallback writes to disk, which doesn't persist on serverless hosting.
