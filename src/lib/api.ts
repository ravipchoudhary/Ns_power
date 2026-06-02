import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) return error("Unauthorized", 401);
  return session;
}

export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  if (session.role !== "ADMIN") return error("Forbidden", 403);
  return session;
}
