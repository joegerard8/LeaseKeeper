import { requireManager } from "@/lib/auth";
import { listPropertiesForManager } from "@/lib/queries";
import { PropertiesList } from "@/components/manager/properties-list";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const manager = await requireManager();
  const properties = await listPropertiesForManager(manager.id);
  return <PropertiesList properties={properties} />;
}
