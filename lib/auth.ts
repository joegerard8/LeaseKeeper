import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenants, users } from "@/db/schema";

const COOKIE_NAME = "lk_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "manager" | "tenant";

type SessionPayload = {
  userId: number;
  role: Role;
  exp: number;
};

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustResetPassword: boolean;
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add AUTH_SECRET=<a long random string> to .env.local.",
    );
  }
  return secret;
}

function sign(body: string): string {
  return crypto.createHmac("sha256", getAuthSecret()).update(body).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length || !crypto.timingSafeEqual(provided, wanted)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    if (payload.role !== "manager" && payload.role !== "tenant") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, role: Role): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = encodeSession({ userId, role, exp });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = decodeSession(token);
  if (!session) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustResetPassword: user.mustResetPassword,
  };
}

// Requires a valid session but does NOT redirect on mustResetPassword - this
// is the one guard the reset-password page itself uses, since every other
// guard below sends a must-reset account there instead of on to its home.
export async function requireAnyUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireManager(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.mustResetPassword) redirect("/reset-password");
  if (user.role !== "manager") redirect("/portal");
  return user;
}

export async function requireTenant(): Promise<CurrentUser & { tenantId: number }> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.mustResetPassword) redirect("/reset-password");
  if (user.role !== "tenant") redirect("/dashboard");

  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.userId, user.id)).limit(1);
  if (!tenant) redirect("/sign-in");

  return { ...user, tenantId: tenant.id };
}
