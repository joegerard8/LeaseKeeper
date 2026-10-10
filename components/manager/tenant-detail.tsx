"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createTenantPortalAccountAction,
  deleteTenantAction,
  resetTenantPasswordAction,
  updateTenantAction,
} from "@/app/actions/tenants";
import { initialActionState, initialPortalAccountState } from "@/lib/action-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

type Tenant = {
  id: number;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  userId: number | null;
  propertyId: number;
  propertyName: string;
};

type LeaseRow = {
  id: number;
  fileName: string;
  status: "uploaded" | "analyzing" | "analyzed" | "analysis_failed";
  uploadedAt: string;
};

const STATUS_LABEL: Record<LeaseRow["status"], string> = {
  uploaded: "Uploaded",
  analyzing: "Analyzing...",
  analyzed: "Analyzed",
  analysis_failed: "Analysis failed",
};

export function TenantDetail({ tenant, leases }: { tenant: Tenant; leases: LeaseRow[] }) {
  const [updateState, updateFormAction] = useActionState(updateTenantAction, initialActionState);
  const [portalState, portalFormAction] = useActionState(
    createTenantPortalAccountAction,
    initialPortalAccountState,
  );
  const [resetState, resetFormAction] = useActionState(resetTenantPasswordAction, initialPortalAccountState);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/tenants" className="text-sm text-muted-foreground hover:underline">
            &larr; Tenants
          </Link>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{tenant.propertyName}</p>
        </div>
        <form
          action={deleteTenantAction}
          onSubmit={(event) => {
            if (!confirm(`Delete ${tenant.name}? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="tenantId" value={tenant.id} />
          <Button type="submit" variant="destructive">
            Delete tenant
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFormAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Tenant name</Label>
              <Input id="name" name="name" defaultValue={tenant.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" defaultValue={tenant.contactEmail ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" name="contactPhone" defaultValue={tenant.contactPhone ?? ""} />
            </div>

            {updateState.error && (
              <p className="text-sm text-destructive sm:col-span-2">{updateState.error}</p>
            )}

            <div className="sm:col-span-2">
              <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant portal access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resetState.tempPassword ? (
            <div className="rounded-md border bg-muted/50 p-4 text-sm">
              <p className="font-medium">New temporary password issued.</p>
              <p>
                Temporary password: <span className="font-mono">{resetState.tempPassword}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                Share this with the tenant now - it will not be shown again. They will be asked to
                set their own password the next time they sign in.
              </p>
            </div>
          ) : portalState.tempPassword ? (
            <div className="rounded-md border bg-muted/50 p-4 text-sm">
              <p className="font-medium">Portal account created.</p>
              <p className="mt-1">
                Email: <span className="font-mono">{portalState.email}</span>
              </p>
              <p>
                Temporary password: <span className="font-mono">{portalState.tempPassword}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                Share this with the tenant now - it will not be shown again. They will be asked to
                set their own password the first time they sign in.
              </p>
            </div>
          ) : tenant.userId ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                This tenant has a portal account and can sign in.
              </p>
              <form action={resetFormAction}>
                <input type="hidden" name="tenantId" value={tenant.id} />
                {resetState.error && <p className="text-sm text-destructive">{resetState.error}</p>}
                <SubmitButton variant="outline" size="sm" pendingText="Resetting...">
                  Reset password
                </SubmitButton>
              </form>
            </div>
          ) : (
            <form action={portalFormAction} className="flex flex-wrap items-end gap-4">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <div className="grid gap-2">
                <Label htmlFor="portal-email">Tenant login email</Label>
                <Input
                  id="portal-email"
                  name="email"
                  type="email"
                  defaultValue={tenant.contactEmail ?? ""}
                  required
                  className="w-64"
                />
              </div>
              {portalState.error && <p className="text-sm text-destructive">{portalState.error}</p>}
              <SubmitButton pendingText="Creating...">Create portal account</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leases</h2>
          <Button asChild>
            <Link href={`/tenants/${tenant.id}/leases/new`}>Upload lease</Link>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {leases.map((lease) => (
            <Link
              key={lease.id}
              href={`/leases/${lease.id}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-accent"
            >
              <span className="font-medium">{lease.fileName}</span>
              <Badge variant={lease.status === "analysis_failed" ? "destructive" : "secondary"}>
                {STATUS_LABEL[lease.status]}
              </Badge>
            </Link>
          ))}
          {leases.length === 0 && (
            <p className="text-sm text-muted-foreground">No leases uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
