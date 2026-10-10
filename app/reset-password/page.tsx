import { requireAnyUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  await requireAnyUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account was created with a temporary password. Choose a new one to continue.
        </p>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
