"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { leases } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { getTenantForManager } from "@/lib/queries";
import { extractLeaseText } from "@/lib/pdf";
import { analyzeLease } from "@/lib/ai/analyze";
import type { ActionState } from "@/lib/action-state";

// tenantId travels via a hidden form field (not .bind()) - see the note on
// updatePropertyAction for why. propertyId is derived from the tenant
// lookup rather than trusted from the client.
export async function uploadLeaseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const tenantId = Number(formData.get("tenantId"));
  const tenant = await getTenantForManager(manager.id, tenantId);
  if (!tenant) {
    return { error: "Tenant not found." };
  }
  const propertyId = tenant.propertyId;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a .txt or .pdf lease file to upload." };
  }

  let rawText: string;
  try {
    rawText = await extractLeaseText(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not read that file." };
  }

  const db = getDb();
  const [lease] = await db
    .insert(leases)
    .values({ tenantId, propertyId, fileName: file.name, rawText, status: "uploaded" })
    .returning();

  try {
    // analyzeLease resolves the lease to "analyzed" or "analysis_failed"
    // internally in both the success and failure case - this outer catch is
    // only a safety net for something unexpected before that point.
    await analyzeLease(lease.id);
  } catch (error) {
    console.error("Lease analysis failed to run:", error);
  }

  revalidatePath(`/tenants/${tenantId}`);
  redirect(`/leases/${lease.id}`);
}
