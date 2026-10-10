"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { properties } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { getPropertyForManager } from "@/lib/queries";
import type { ActionState } from "@/lib/action-state";

function readPropertyFields(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    addressLine1: String(formData.get("addressLine1") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    state: String(formData.get("state") || "").trim(),
    zip: String(formData.get("zip") || "").trim(),
  };
}

function validatePropertyFields(fields: ReturnType<typeof readPropertyFields>): string | null {
  if (!fields.name || !fields.addressLine1 || !fields.city || !fields.state || !fields.zip) {
    return "All fields are required.";
  }
  return null;
}

export async function createPropertyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const fields = readPropertyFields(formData);
  const error = validatePropertyFields(fields);
  if (error) return { error };

  const db = getDb();
  await db.insert(properties).values({ managerId: manager.id, ...fields });

  revalidatePath("/properties");
  redirect("/properties");
}

// propertyId travels in the form body (a hidden field) rather than via
// .bind() - binding a leading arg onto a Server Action used with
// useActionState hangs this Next.js/Turbopack dev setup whenever the action
// resolves without calling redirect() (reproduced with a minimal action with
// no app logic at all). Every action below follows the same form-field
// pattern for that reason.
export async function updatePropertyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const propertyId = Number(formData.get("propertyId"));
  const existing = await getPropertyForManager(manager.id, propertyId);
  if (!existing) return { error: "Property not found." };

  const fields = readPropertyFields(formData);
  const error = validatePropertyFields(fields);
  if (error) return { error };

  const db = getDb();
  await db
    .update(properties)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(properties.id, propertyId));

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function deletePropertyAction(formData: FormData): Promise<void> {
  const manager = await requireManager();
  const propertyId = Number(formData.get("propertyId"));
  const existing = await getPropertyForManager(manager.id, propertyId);
  if (!existing) throw new Error("Property not found.");

  const db = getDb();
  await db.delete(properties).where(eq(properties.id, propertyId));
  revalidatePath("/properties");
  redirect("/properties");
}
