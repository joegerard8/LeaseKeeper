"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createTenantAction } from "@/app/actions/tenants";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/submit-button";

type TenantRow = {
  id: number;
  name: string;
  contactEmail: string | null;
  propertyName: string;
  userId: number | null;
};

type PropertyOption = { id: number; name: string };

export function TenantsList({
  tenants,
  properties,
}: {
  tenants: TenantRow[];
  properties: PropertyOption[];
}) {
  const [state, formAction] = useActionState(createTenantAction, initialActionState);
  const [open, setOpen] = useState(tenants.length === 0 && properties.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        {properties.length > 0 && (
          <Button variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Add tenant"}
          </Button>
        )}
      </div>

      {properties.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add a property first, then you can add tenants to it.
        </p>
      )}

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>New tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="propertyId">Property</Label>
                <NativeSelect id="propertyId" name="propertyId" required defaultValue="">
                  <NativeSelectOption value="" disabled>
                    Choose a property
                  </NativeSelectOption>
                  {properties.map((property) => (
                    <NativeSelectOption key={property.id} value={property.id}>
                      {property.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tenant name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input id="contactPhone" name="contactPhone" />
              </div>

              {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}

              <div className="sm:col-span-2">
                <SubmitButton pendingText="Adding...">Add tenant</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/tenants/${tenant.id}`}
            className="flex items-center justify-between rounded-md border px-4 py-3 text-sm hover:bg-accent"
          >
            <span>
              <span className="font-medium">{tenant.name}</span>
              <span className="text-muted-foreground"> &middot; {tenant.propertyName}</span>
            </span>
            <span className="text-muted-foreground">
              {tenant.userId ? "Portal active" : "No portal account"}
            </span>
          </Link>
        ))}
        {tenants.length === 0 && properties.length > 0 && (
          <p className="text-sm text-muted-foreground">No tenants yet.</p>
        )}
      </div>
    </div>
  );
}
