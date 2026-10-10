import { requireTenant } from "@/lib/auth";
import {
  getActiveObligationsForTenant,
  listLeasesForTenantPortal,
  listRemindersForTenant,
} from "@/lib/queries";
import { PortalView } from "@/components/tenant/portal-view";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const tenant = await requireTenant();

  const [leases, obligations, reminders] = await Promise.all([
    listLeasesForTenantPortal(tenant.tenantId),
    getActiveObligationsForTenant(tenant.tenantId),
    listRemindersForTenant(tenant.tenantId),
  ]);

  return (
    <PortalView tenantName={tenant.name} leases={leases} obligations={obligations} reminders={reminders} />
  );
}
