import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Thin database layer.
 *
 * - If DATABASE_URL is set, connects to a real PostgreSQL server through `pg`.
 * - Otherwise falls back to PGlite (PostgreSQL compiled to WASM, persisted in
 *   ./.data) so the project runs locally with zero database setup.
 *
 * Both drivers speak the same SQL, so the rest of the app only sees `query()`.
 */
interface Driver {
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  exec(sql: string): Promise<void>;
}

const schemaSql = () =>
  readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  let driver: Driver;

  if (url) {
    const { Pool } = await import("pg");
    const isLocal = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
    driver = {
      query: async (sql, params) => (await pool.query(sql, params)).rows,
      exec: async (sql) => {
        await pool.query(sql);
      },
    };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = path.join(process.cwd(), ".data", "pglite");
    mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    driver = {
      query: async (sql, params) => (await db.query(sql, params)).rows,
      exec: async (sql) => {
        await db.exec(sql);
      },
    };
  }

  await driver.exec(schemaSql());
  return driver;
}

// Reuse one connection across hot reloads and requests.
const globalForDb = globalThis as unknown as { __db?: Promise<Driver> };

function getDriver(): Promise<Driver> {
  if (!globalForDb.__db) {
    globalForDb.__db = createDriver().catch((err) => {
      globalForDb.__db = undefined; // allow a retry on the next request
      throw err;
    });
  }
  return globalForDb.__db;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const driver = await getDriver();
  return (await driver.query(sql, params)) as T[];
}
