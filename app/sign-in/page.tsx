"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default function SignInPage() {
  const [state, formAction] = useActionState(signInAction, initialActionState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Property managers and tenants both sign in here.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <SubmitButton className="w-full" pendingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Property manager?{" "}
        <Button asChild variant="link" className="h-auto p-0">
          <Link href="/sign-up">Create an account</Link>
        </Button>
      </p>
    </main>
  );
}
