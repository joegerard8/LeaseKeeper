import { notFound } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { getPropertyForManager, listTenantsForProperty } from "@/lib/queries";
import { PropertyDetail } from "@/components/manager/property-detail";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = Number(id);
  const manager = await requireManager();

  const property = await getPropertyForManager(manager.id, propertyId);
  if (!property) notFound();

  const tenants = await listTenantsForProperty(manager.id, propertyId);

  return <PropertyDetail property={property} tenants={tenants} />;
}
