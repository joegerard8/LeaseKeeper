"use client";

import { useState } from "react";
import { updateReminderStatusAction } from "@/app/actions/reminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Lease = { id: number; fileName: string; status: string; uploadedAt: string };
type Obligation = { id: number; title: string; description: string; type: string };
type Reminder = {
  id: number;
  dueDate: string;
  targetDate: string;
  status: "pending" | "done" | "dismissed";
  obligationTitle: string;
  obligationDescription: string;
  obligationType: string;
};

export function PortalView({
  tenantName,
  leases,
  obligations,
  reminders,
}: {
  tenantName: string;
  leases: Lease[];
  obligations: Obligation[];
  reminders: Reminder[];
}) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const today = todayIso();
  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const dueNow = pendingReminders.filter((r) => r.dueDate <= today);
  const upcoming = pendingReminders.filter((r) => r.dueDate > today);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {tenantName}</h1>
        <p className="text-sm text-muted-foreground">Your lease, obligations, and reminders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action required</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {dueNow.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing needs your attention right now.</p>
          )}
          {dueNow.map((reminder) => (
            <div
              key={reminder.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{reminder.obligationTitle}</p>
                <p className="text-muted-foreground">{reminder.obligationDescription}</p>
                <p className="text-muted-foreground">due {reminder.targetDate}</p>
              </div>
              <form action={updateReminderStatusAction}>
                <input type="hidden" name="reminderId" value={reminder.id} />
                <input type="hidden" name="status" value="done" />
                <Button type="submit" size="sm">
                  Mark acknowledged
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming ({upcoming.length})</CardTitle>
            {upcoming.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowUpcoming((v) => !v)}>
                {showUpcoming ? "Hide" : "Show"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing scheduled further out yet.</p>
          )}
          {showUpcoming &&
            upcoming.map((reminder) => (
              <div key={reminder.id} className="rounded-md border px-4 py-3 text-sm">
                <p className="font-medium">{reminder.obligationTitle}</p>
                <p className="text-muted-foreground">due {reminder.targetDate}</p>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your obligations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {obligations.map((obligation) => (
            <div key={obligation.id} className="rounded-md border px-4 py-3 text-sm">
              <p className="font-medium">{obligation.title}</p>
              <p className="text-muted-foreground">{obligation.description}</p>
            </div>
          ))}
          {obligations.length === 0 && (
            <p className="text-sm text-muted-foreground">No active obligations yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your lease documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {leases.map((lease) => (
            <div key={lease.id} className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
              <span>{lease.fileName}</span>
              <Badge variant="outline">{lease.status}</Badge>
            </div>
          ))}
          {leases.length === 0 && <p className="text-sm text-muted-foreground">No leases on file yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
