import Link from "next/link";
import { requireManager } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const manager = await requireManager();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="font-semibold">
              LeaseKeeper
            </Link>
            <Link href="/properties" className="text-muted-foreground hover:text-foreground">
              Properties
            </Link>
            <Link href="/tenants" className="text-muted-foreground hover:text-foreground">
              Tenants
            </Link>
            <Link href="/reminders" className="text-muted-foreground hover:text-foreground">
              Reminders
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{manager.name}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
