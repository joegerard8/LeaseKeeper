import Link from "next/link";
import { requireManager } from "@/lib/auth";
import {
  listPendingObligationsForManager,
  listPropertiesForManager,
  listRemindersForManager,
  listTenantsForManager,
} from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const manager = await requireManager();
  const [properties, tenants, pendingObligations, allReminders] = await Promise.all([
    listPropertiesForManager(manager.id),
    listTenantsForManager(manager.id),
    listPendingObligationsForManager(manager.id),
    listRemindersForManager(manager.id),
  ]);

  const upcomingReminders = allReminders.filter((reminder) => reminder.status === "pending").slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {manager.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Here is what needs your attention.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Properties</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{properties.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Tenants</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{tenants.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Awaiting review</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pendingObligations.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obligations awaiting review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pendingObligations.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing waiting on you right now.</p>
          )}
          {pendingObligations.map((obligation) => (
            <Link
              key={obligation.id}
              href={`/leases/${obligation.leaseId}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-accent"
            >
              <span>
                <span className="font-medium">{obligation.title}</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {obligation.tenantName} &middot; {obligation.propertyName}
                </span>
              </span>
              <Badge variant="secondary">Review</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming reminders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {upcomingReminders.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending reminders.</p>
          )}
          {upcomingReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium">{reminder.obligationTitle}</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {reminder.tenantName} &middot; {reminder.propertyName}
                </span>
              </span>
              <span className="text-muted-foreground">due {reminder.dueDate}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
