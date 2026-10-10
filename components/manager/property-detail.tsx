"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { deletePropertyAction, updatePropertyAction } from "@/app/actions/properties";
import { createTenantAction } from "@/app/actions/tenants";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { properties as propertiesTable, tenants as tenantsTable } from "@/db/schema";

type Property = typeof propertiesTable.$inferSelect;
type Tenant = Pick<
  typeof tenantsTable.$inferSelect,
  "id" | "name" | "contactEmail" | "contactPhone" | "userId"
>;

export function PropertyDetail({ property, tenants }: { property: Property; tenants: Tenant[] }) {
  const [updateState, updateFormAction] = useActionState(updatePropertyAction, initialActionState);

  const [tenantState, tenantFormAction] = useActionState(createTenantAction, initialActionState);
  const [showAddTenant, setShowAddTenant] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/properties" className="text-sm text-muted-foreground hover:underline">
            &larr; Properties
          </Link>
          <h1 className="text-2xl font-semibold">{property.name}</h1>
        </div>
        <form
          action={deletePropertyAction}
          onSubmit={(event) => {
            if (!confirm(`Delete ${property.name}? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="propertyId" value={property.id} />
          <Button type="submit" variant="destructive">
            Delete property
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFormAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="propertyId" value={property.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Property name</Label>
              <Input id="name" name="name" defaultValue={property.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addressLine1">Address</Label>
              <Input id="addressLine1" name="addressLine1" defaultValue={property.addressLine1} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={property.city} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={property.state} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" name="zip" defaultValue={property.zip} required />
              </div>
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tenants at this property</h2>
          <Button variant="outline" onClick={() => setShowAddTenant((v) => !v)}>
            {showAddTenant ? "Cancel" : "Add tenant"}
          </Button>
        </div>

        {showAddTenant && (
          <Card>
            <CardContent className="pt-6">
              <form action={tenantFormAction} className="grid gap-4 sm:grid-cols-3">
                <input type="hidden" name="propertyId" value={property.id} />
                <div className="grid gap-2">
                  <Label htmlFor="tenant-name">Tenant name</Label>
                  <Input id="tenant-name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-email">Contact email</Label>
                  <Input id="tenant-email" name="contactEmail" type="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant-phone">Contact phone</Label>
                  <Input id="tenant-phone" name="contactPhone" />
                </div>

                {tenantState.error && (
                  <p className="text-sm text-destructive sm:col-span-3">{tenantState.error}</p>
                )}

                <div className="sm:col-span-3">
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
              <span className="font-medium">{tenant.name}</span>
              <span className="text-muted-foreground">{tenant.contactEmail ?? "No contact email"}</span>
            </Link>
          ))}
          {tenants.length === 0 && (
            <p className="text-sm text-muted-foreground">No tenants at this property yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
