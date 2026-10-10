"use client";

import { useState } from "react";
import { updateReminderStatusAction } from "@/app/actions/reminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReminderRow = {
  id: number;
  dueDate: string;
  targetDate: string;
  leadDays: number;
  status: "pending" | "done" | "dismissed";
  obligationTitle: string;
  obligationType: string;
  tenantName: string;
  propertyName: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ReminderCard({ reminder }: { reminder: ReminderRow }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div>
          <p className="font-medium">{reminder.obligationTitle}</p>
          <p className="text-sm text-muted-foreground">
            {reminder.tenantName} &middot; {reminder.propertyName} &middot; due {reminder.dueDate} ({reminder.leadDays}
            d before {reminder.targetDate})
          </p>
        </div>
        <form action={updateReminderStatusAction} className="flex gap-2">
          <input type="hidden" name="reminderId" value={reminder.id} />
          <Button type="submit" name="status" value="done" size="sm">
            Mark done
          </Button>
          <Button type="submit" name="status" value="dismissed" size="sm" variant="outline">
            Dismiss
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function RemindersList({ reminders }: { reminders: ReminderRow[] }) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const today = todayIso();

  const pending = reminders.filter((r) => r.status === "pending");
  const dueNow = pending.filter((r) => r.dueDate <= today);
  const upcoming = pending.filter((r) => r.dueDate > today);
  const resolved = reminders.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Reminders</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Due now ({dueNow.length})</h2>
        {dueNow.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} />
        ))}
        {dueNow.length === 0 && <p className="text-sm text-muted-foreground">Nothing due right now.</p>}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming ({upcoming.length})</h2>
          {upcoming.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowUpcoming((v) => !v)}>
              {showUpcoming ? "Hide" : "Show"} upcoming
            </Button>
          )}
        </div>
        {showUpcoming &&
          upcoming.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} />)}
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing scheduled further out yet.</p>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Resolved</h2>
          {resolved.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm text-muted-foreground"
            >
              <span>
                {reminder.obligationTitle} &middot; {reminder.tenantName}
              </span>
              <Badge variant="outline">{reminder.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
