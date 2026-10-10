"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createManualObligationAction, reviewObligationAction } from "@/app/actions/obligations";
import { initialActionState } from "@/lib/action-state";
import { ObligationFields } from "./obligation-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";

type Lease = {
  id: number;
  fileName: string;
  rawText: string;
  status: "uploaded" | "analyzing" | "analyzed" | "analysis_failed";
  uploadedAt: string;
  tenantId: number;
  propertyId: number;
  tenantName: string;
  propertyName: string;
};

type Obligation = {
  id: number;
  leaseId: number;
  type: string;
  title: string;
  description: string;
  sourceQuote: string;
  dueRule: string;
  confidence: number;
  status: "pending_review" | "approved" | "rejected" | "manual";
};

type Reminder = {
  id: number;
  obligationId: number;
  targetDate: string;
  leadDays: number;
  dueDate: string;
  status: "pending" | "done" | "dismissed";
};

const STATUS_BADGE: Record<Obligation["status"], { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  pending_review: { label: "Needs review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  manual: { label: "Manual", variant: "outline" },
};

function parseDueRule(raw: string) {
  try {
    return JSON.parse(raw) as
      | { kind: "once"; date: string }
      | { kind: "recurring"; frequency: string; anchorDate: string };
  } catch {
    return { kind: "once" as const, date: "" };
  }
}

function DueRuleSummary({ dueRule }: { dueRule: ReturnType<typeof parseDueRule> }) {
  if (dueRule.kind === "once") {
    return <span>Due {dueRule.date}</span>;
  }
  return (
    <span>
      {dueRule.frequency.toLowerCase()}, starting {dueRule.anchorDate}
    </span>
  );
}

function PendingObligationCard({ obligation, leaseId }: { obligation: Obligation; leaseId: number }) {
  const [state, formAction] = useActionState(reviewObligationAction, initialActionState);
  const dueRule = parseDueRule(obligation.dueRule);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{obligation.title}</CardTitle>
          <Badge variant="secondary">Needs review</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <blockquote className="rounded-md border-l-2 border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground">
          &quot;{obligation.sourceQuote}&quot;
        </blockquote>
        <p className="text-xs text-muted-foreground">
          AI confidence: {Math.round(obligation.confidence * 100)}%
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="obligationId" value={obligation.id} />
          <input type="hidden" name="leaseId" value={leaseId} />
          <ObligationFields
            idPrefix={`obligation-${obligation.id}`}
            defaultType={obligation.type}
            defaultTitle={obligation.title}
            defaultDescription={obligation.description}
            defaultDueRule={dueRule}
          />

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex gap-2">
            <SubmitButton name="intent" value="approve" pendingText="Saving...">
              Approve
            </SubmitButton>
            <SubmitButton name="intent" value="reject" variant="outline" pendingText="Saving...">
              Reject
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DecidedObligationCard({
  obligation,
  reminders,
}: {
  obligation: Obligation;
  reminders: Reminder[];
}) {
  const dueRule = parseDueRule(obligation.dueRule);
  const badge = STATUS_BADGE[obligation.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{obligation.title}</CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">{obligation.description}</p>
        <p>
          <DueRuleSummary dueRule={dueRule} />
        </p>
        {reminders.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {reminders.map((reminder) => (
              <Badge key={reminder.id} variant="outline">
                {reminder.status === "pending" ? "Reminder" : reminder.status} {reminder.dueDate}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddObligationForm({
  leaseId,
  defaultOpen,
}: {
  leaseId: number;
  defaultOpen: boolean;
}) {
  const [state, formAction] = useActionState(createManualObligationAction, initialActionState);
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Add obligation manually
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New obligation</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="leaseId" value={leaseId} />
          <ObligationFields idPrefix="manual-obligation" />
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton pendingText="Adding...">Add obligation</SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const LEASE_STATUS_LABEL: Record<Lease["status"], string> = {
  uploaded: "Uploaded",
  analyzing: "Analyzing...",
  analyzed: "Analyzed",
  analysis_failed: "Analysis failed",
};

export function LeaseReview({
  lease,
  obligations,
  remindersByObligationId,
}: {
  lease: Lease;
  obligations: Obligation[];
  remindersByObligationId: Record<number, Reminder[]>;
}) {
  const pending = obligations.filter((o) => o.status === "pending_review");
  const decided = obligations.filter((o) => o.status !== "pending_review");
  const [showRawText, setShowRawText] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/tenants/${lease.tenantId}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {lease.tenantName}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{lease.fileName}</h1>
          <Badge variant={lease.status === "analysis_failed" ? "destructive" : "secondary"}>
            {LEASE_STATUS_LABEL[lease.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {lease.tenantName} &middot; {lease.propertyName}
        </p>
      </div>

      {lease.status === "analysis_failed" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Automatic lease analysis failed for this file. You can still add obligations by hand below.
        </p>
      )}

      <div>
        <Button variant="outline" size="sm" onClick={() => setShowRawText((v) => !v)}>
          {showRawText ? "Hide lease text" : "Show lease text"}
        </Button>
        {showRawText && (
          <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs">
            {lease.rawText}
          </pre>
        )}
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Awaiting your review ({pending.length})</h2>
          {pending.map((obligation) => (
            <PendingObligationCard key={obligation.id} obligation={obligation} leaseId={lease.id} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">All obligations</h2>
        {decided.map((obligation) => (
          <DecidedObligationCard
            key={obligation.id}
            obligation={obligation}
            reminders={remindersByObligationId[obligation.id] ?? []}
          />
        ))}
        {decided.length === 0 && (
          <p className="text-sm text-muted-foreground">No approved obligations yet.</p>
        )}
        <AddObligationForm
          leaseId={lease.id}
          defaultOpen={pending.length === 0 && decided.length === 0}
        />
      </div>
    </div>
  );
}
