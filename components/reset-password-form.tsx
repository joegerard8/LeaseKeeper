"use client";

import { useActionState } from "react";
import { resetOwnPasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetOwnPasswordAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton className="w-full" pendingText="Saving...">
        Set password
      </SubmitButton>
    </form>
  );
}
