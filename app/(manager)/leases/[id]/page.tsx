import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import {
  getLeaseForManager,
  listObligationsForLease,
  listRemindersForObligationIds,
} from "@/lib/queries";
import { LeaseReview } from "@/components/manager/lease-review";

export const dynamic = "force-dynamic";

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leaseId = Number(id);
  const manager = await requireManager();

  const lease = await getLeaseForManager(manager.id, leaseId);
  if (!lease) notFound();

  const obligations = await listObligationsForLease(leaseId);
  const reminders = await listRemindersForObligationIds(obligations.map((o) => o.id));

  const remindersByObligationId: Record<number, typeof reminders> = {};
  for (const reminder of reminders) {
    (remindersByObligationId[reminder.obligationId] ??= []).push(reminder);
  }

  return (
    <LeaseReview lease={lease} obligations={obligations} remindersByObligationId={remindersByObligationId} />
  );
}
