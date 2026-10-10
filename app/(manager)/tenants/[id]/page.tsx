import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { getTenantForManager, listLeasesForTenant } from "@/lib/queries";
import { TenantDetail } from "@/components/manager/tenant-detail";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = Number(id);
  const manager = await requireManager();

  const tenant = await getTenantForManager(manager.id, tenantId);
  if (!tenant) notFound();

  const leases = await listLeasesForTenant(manager.id, tenantId);

  return <TenantDetail tenant={tenant} leases={leases} />;
}
