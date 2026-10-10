import { requireManager } from "@/lib/auth";
import { listRemindersForManager } from "@/lib/queries";
import { RemindersList } from "@/components/manager/reminders-list";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const manager = await requireManager();
  const reminders = await listRemindersForManager(manager.id);
  return <RemindersList reminders={reminders} />;
}
