"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPropertyAction } from "@/app/actions/properties";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { properties as propertiesTable } from "@/db/schema";

type Property = typeof propertiesTable.$inferSelect;

export function PropertiesList({ properties }: { properties: Property[] }) {
  const [state, formAction] = useActionState(createPropertyAction, initialActionState);
  const [open, setOpen] = useState(properties.length === 0);

  useEffect(() => {
    if (!state.error) return;
    setOpen(true);
  }, [state]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <Button variant="outline" onClick={() => setOpen((value) => !value)}>
          {open ? "Cancel" : "Add property"}
        </Button>
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>New property</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Property name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="addressLine1">Address</Label>
                <Input id="addressLine1" name="addressLine1" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input id="zip" name="zip" required />
                </div>
              </div>

              {state.error && (
                <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
              )}

              <div className="sm:col-span-2">
                <SubmitButton pendingText="Adding...">Add property</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {properties.map((property) => (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {property.addressLine1}, {property.city}, {property.state} {property.zip}
              </CardContent>
            </Card>
          </Link>
        ))}
        {properties.length === 0 && (
          <p className="text-sm text-muted-foreground">No properties yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}
