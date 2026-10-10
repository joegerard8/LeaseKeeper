"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { obligations } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { approveObligationAndScheduleReminders } from "@/lib/reminders";
import { getLeaseForManager } from "@/lib/queries";
import { dueRuleSchema, obligationCandidateSchema } from "@/lib/ai/schema";
import type { ActionState } from "@/lib/action-state";

function readDueRuleFromForm(formData: FormData) {
  const kind = String(formData.get("dueKind") || "");
  if (kind === "once") {
    return { kind: "once" as const, date: String(formData.get("dueDate") || "") };
  }
  return {
    kind: "recurring" as const,
    frequency: String(formData.get("dueFrequency") || "") as "MONTHLY" | "QUARTERLY" | "ANNUALLY",
    anchorDate: String(formData.get("dueAnchorDate") || ""),
  };
}

// Handles approve/reject for an AI-extracted (pending_review) obligation.
// The manager can edit the fields in the same submission - whatever is in
// the form is saved first, then approve/reject is applied to the edited
// version. Rejecting never schedules reminders; only approve does (via
// approveObligationAndScheduleReminders, the deterministic Layer 2 mapper).
export async function reviewObligationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const obligationId = Number(formData.get("obligationId"));
  const leaseId = Number(formData.get("leaseId"));
  const lease = await getLeaseForManager(manager.id, leaseId);
  if (!lease) return { error: "Lease not found." };

  const [obligation] = await getDb()
    .select({ leaseId: obligations.leaseId })
    .from(obligations)
    .where(eq(obligations.id, obligationId))
    .limit(1);
  if (!obligation || obligation.leaseId !== leaseId) {
    return { error: "Obligation not found." };
  }

  const intent = String(formData.get("intent") || "");
  if (intent !== "approve" && intent !== "reject") {
    return { error: "Unknown action." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const type = String(formData.get("type") || "");

  const typeParsed = obligationCandidateSchema.pick({ type: true }).safeParse({ type });
  if (!title || !description || !typeParsed.success) {
    return { error: "Title, description, and a valid type are required." };
  }

  const dueRuleParsed = dueRuleSchema.safeParse(readDueRuleFromForm(formData));
  if (!dueRuleParsed.success) {
    return { error: "Enter a valid due date (or a recurrence anchor date)." };
  }

  const db = getDb();
  await db
    .update(obligations)
    .set({
      title,
      description,
      type: typeParsed.data.type,
      dueRule: JSON.stringify(dueRuleParsed.data),
    })
    .where(eq(obligations.id, obligationId));

  if (intent === "approve") {
    await approveObligationAndScheduleReminders(obligationId, manager.id);
  } else {
    await db
      .update(obligations)
      .set({ status: "rejected", reviewedAt: new Date().toISOString(), reviewedBy: manager.id })
      .where(eq(obligations.id, obligationId));
  }

  revalidatePath(`/leases/${leaseId}`);
  redirect(`/leases/${leaseId}`);
}

// Lets a manager add an obligation directly, bypassing AI entirely. This is
// the fallback path when a lease's analysis fails, and is always available
// even when it succeeds - AI is an accelerator, never a hard dependency.
export async function createManualObligationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const leaseId = Number(formData.get("leaseId"));
  const lease = await getLeaseForManager(manager.id, leaseId);
  if (!lease) {
    return { error: "Lease not found." };
  }
  const { tenantId, propertyId } = lease;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const type = String(formData.get("type") || "");

  const typeParsed = obligationCandidateSchema.pick({ type: true }).safeParse({ type });
  if (!title || !description || !typeParsed.success) {
    return { error: "Title, description, and a valid type are required." };
  }

  const dueRuleParsed = dueRuleSchema.safeParse(readDueRuleFromForm(formData));
  if (!dueRuleParsed.success) {
    return { error: "Enter a valid due date (or a recurrence anchor date)." };
  }

  const db = getDb();
  const [obligation] = await db
    .insert(obligations)
    .values({
      leaseId,
      tenantId,
      propertyId,
      type: typeParsed.data.type,
      title,
      description,
      sourceQuote: "(entered manually by property manager)",
      dueRule: JSON.stringify(dueRuleParsed.data),
      confidence: 1,
    })
    .returning();

  await approveObligationAndScheduleReminders(obligation.id, manager.id);

  revalidatePath(`/leases/${leaseId}`);
  redirect(`/leases/${leaseId}`);
}
