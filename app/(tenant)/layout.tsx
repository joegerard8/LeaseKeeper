import { requireTenant } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="font-semibold">LeaseKeeper</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{tenant.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
