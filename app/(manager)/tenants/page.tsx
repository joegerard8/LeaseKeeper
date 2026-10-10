import { requireManager } from "@/lib/auth";
import { listPropertiesForManager, listTenantsForManager } from "@/lib/queries";
import { TenantsList } from "@/components/manager/tenants-list";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const manager = await requireManager();
  const [tenants, properties] = await Promise.all([
    listTenantsForManager(manager.id),
    listPropertiesForManager(manager.id),
  ]);

  return (
    <TenantsList
      tenants={tenants}
      properties={properties.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
