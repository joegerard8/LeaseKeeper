"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireAnyUser, verifyPassword } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";

export async function signUpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: "manager" })
    .returning();

  await createSession(user.id, "manager");
  redirect("/dashboard");
}

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, user.role);
  if (user.mustResetPassword) redirect("/reset-password");
  redirect(user.role === "manager" ? "/dashboard" : "/portal");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/sign-in");
}

// Used by /reset-password - gates every account created with a manager-set
// temp password (see createTenantPortalAccountAction / resetTenantPasswordAction)
// until the account holder picks their own password.
export async function resetOwnPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAnyUser();

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await hashPassword(password);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, mustResetPassword: false })
    .where(eq(users.id, user.id));

  redirect(user.role === "manager" ? "/dashboard" : "/portal");
}
