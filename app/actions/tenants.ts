"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { tenants, users } from "@/db/schema";
import { hashPassword, requireManager } from "@/lib/auth";
import { getPropertyForManager, getTenantForManager } from "@/lib/queries";
import type { ActionState, PortalAccountState } from "@/lib/action-state";

function readTenantFields(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim() || null,
    contactPhone: String(formData.get("contactPhone") || "").trim() || null,
  };
}

// propertyId travels in the form body (not a bound arg) so this one action
// works both from a property's own page (hidden field) and from the
// top-level tenants page (a visible property picker).
export async function createTenantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const propertyId = Number(formData.get("propertyId"));
  const fields = readTenantFields(formData);
  if (!fields.name) return { error: "Tenant name is required." };
  if (!propertyId) return { error: "Choose a property for this tenant." };

  const property = await getPropertyForManager(manager.id, propertyId);
  if (!property) return { error: "Property not found." };

  const db = getDb();
  const [tenant] = await db
    .insert(tenants)
    .values({ propertyId, ...fields })
    .returning();

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/tenants");
  redirect(`/tenants/${tenant.id}`);
}

// tenantId travels via a hidden form field (not .bind()) - see the note on
// updatePropertyAction for why.
export async function updateTenantAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const tenantId = Number(formData.get("tenantId"));
  const existing = await getTenantForManager(manager.id, tenantId);
  if (!existing) return { error: "Tenant not found." };

  const fields = readTenantFields(formData);
  if (!fields.name) return { error: "Tenant name is required." };

  const db = getDb();
  await db
    .update(tenants)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${tenantId}`);
  redirect(`/tenants/${tenantId}`);
}

export async function deleteTenantAction(formData: FormData): Promise<void> {
  const manager = await requireManager();
  const tenantId = Number(formData.get("tenantId"));
  const existing = await getTenantForManager(manager.id, tenantId);
  if (!existing) throw new Error("Tenant not found.");

  const db = getDb();
  // Leases, obligations, lease_analyses, and reminders cascade automatically
  // (see db/schema.ts onDelete: "cascade"). The tenant's own portal login
  // (if any) doesn't cascade - tenants.userId points *at* users, not the
  // other way round - so it's removed explicitly here to avoid leaving a
  // stray, unreachable login behind.
  await db.delete(tenants).where(eq(tenants.id, tenantId));
  if (existing.userId) {
    await db.delete(users).where(eq(users.id, existing.userId));
  }

  revalidatePath("/tenants");
  redirect("/tenants");
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

// Managers create tenant portal logins on the tenant's behalf - tenants
// never self-register. The temp password is shown exactly once in the
// resulting state so the manager can hand it off out-of-band.
export async function createTenantPortalAccountAction(
  _prevState: PortalAccountState,
  formData: FormData,
): Promise<PortalAccountState> {
  const manager = await requireManager();
  const tenantId = Number(formData.get("tenantId"));
  const tenant = await getTenantForManager(manager.id, tenantId);
  if (!tenant) {
    return { error: "Tenant not found.", email: null, tempPassword: null };
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { error: "An email address is required to create a portal login.", email: null, tempPassword: null };
  }

  const db = getDb();
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) {
    return { error: "An account with that email already exists.", email: null, tempPassword: null };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const [user] = await db
    .insert(users)
    .values({ name: tenant.name, email, passwordHash, role: "tenant", mustResetPassword: true })
    .returning();

  await db.update(tenants).set({ userId: user.id }).where(eq(tenants.id, tenantId));

  // No revalidatePath here: this action succeeds by returning state for
  // useActionState to render inline (the one-time temp password) rather
  // than redirecting, and every page in this app is already `force-dynamic`
  // so there's no route cache to invalidate.
  return { error: null, email, tempPassword };
}

// There's no email delivery in this MVP, so if a tenant loses their temp
// password before first sign-in (or forgets their password later), the
// manager is the recovery path: this issues a fresh temp password and
// forces another reset on next sign-in, same as account creation.
export async function resetTenantPasswordAction(
  _prevState: PortalAccountState,
  formData: FormData,
): Promise<PortalAccountState> {
  const manager = await requireManager();
  const tenantId = Number(formData.get("tenantId"));
  const tenant = await getTenantForManager(manager.id, tenantId);
  if (!tenant || !tenant.userId) {
    return { error: "This tenant does not have a portal account yet.", email: null, tempPassword: null };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, mustResetPassword: true })
    .where(eq(users.id, tenant.userId));

  return { error: null, email: tenant.contactEmail, tempPassword };
}
