"use client";

import { useActionState } from "react";
import Link from "next/link";
import { uploadLeaseAction } from "@/app/actions/leases";
import { initialActionState } from "@/lib/action-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function LeaseUploadForm({
  tenantId,
  tenantName,
}: {
  tenantId: number;
  tenantName: string;
}) {
  const [state, formAction] = useActionState(uploadLeaseAction, initialActionState);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/tenants/${tenantId}`} className="text-sm text-muted-foreground hover:underline">
          &larr; {tenantName}
        </Link>
        <h1 className="text-2xl font-semibold">Upload lease</h1>
        <p className="text-sm text-muted-foreground">
          Accepts .txt or .pdf. LeaseKeeper will read the lease and extract obligations for you to
          review before anything is scheduled.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease file</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="tenantId" value={tenantId} />
            <div className="grid gap-2">
              <Label htmlFor="file">Lease document</Label>
              <Input id="file" name="file" type="file" accept=".txt,.pdf,application/pdf,text/plain" required />
            </div>

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <SubmitButton pendingText="Uploading and analyzing...">Upload and analyze</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
