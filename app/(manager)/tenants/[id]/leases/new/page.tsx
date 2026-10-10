import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { getTenantForManager } from "@/lib/queries";
import { LeaseUploadForm } from "@/components/manager/lease-upload-form";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = Number(id);
  const manager = await requireManager();

  const tenant = await getTenantForManager(manager.id, tenantId);
  if (!tenant) notFound();

  return <LeaseUploadForm tenantId={tenant.id} tenantName={tenant.name} />;
}
