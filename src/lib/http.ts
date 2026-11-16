import { NextResponse } from "next/server";

export function jsonError(status: number, message: string, details?: Record<string, string>) {
  return NextResponse.json({ error: { message, ...(details ? { details } : {}) } }, { status });
}

/** Reads a JSON body, returning undefined when it is missing or malformed. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Wraps a handler so unexpected failures become a clean 500 without leaking internals. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[api]", err);
      return jsonError(500, "Something went wrong. Please try again.");
    }
  };
}
