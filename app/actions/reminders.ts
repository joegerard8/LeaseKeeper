"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { obligations, properties, reminders, tenants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function assertReminderAccess(reminderId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const db = getDb();
  const [row] = await db
    .select({ managerId: properties.managerId, tenantUserId: tenants.userId })
    .from(reminders)
    .innerJoin(obligations, eq(obligations.id, reminders.obligationId))
    .innerJoin(properties, eq(properties.id, obligations.propertyId))
    .innerJoin(tenants, eq(tenants.id, obligations.tenantId))
    .where(eq(reminders.id, reminderId))
    .limit(1);

  if (!row) throw new Error("Reminder not found");
  const allowed = user.role === "manager" ? row.managerId === user.id : row.tenantUserId === user.id;
  if (!allowed) throw new Error("Not authorized to update this reminder");

  return user;
}

// reminderId and status both travel via the form body (not .bind()) - see
// the note on updatePropertyAction for why.
export async function updateReminderStatusAction(formData: FormData): Promise<void> {
  const reminderId = Number(formData.get("reminderId"));
  const status = String(formData.get("status") || "");
  if (status !== "done" && status !== "dismissed" && status !== "pending") {
    throw new Error("Invalid reminder status.");
  }

  const user = await assertReminderAccess(reminderId);

  const db = getDb();
  await db.update(reminders).set({ status }).where(eq(reminders.id, reminderId));

  revalidatePath("/reminders");
  revalidatePath("/portal");
  redirect(user.role === "manager" ? "/reminders" : "/portal");
}
