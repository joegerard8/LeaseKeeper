import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { leases, obligations, properties, reminders, tenants } from "@/db/schema";

// Every query here scopes by managerId (or tenantId for the portal side) so
// one manager/tenant can never read another's data by guessing an id.

export async function listPropertiesForManager(managerId: number) {
  const db = getDb();
  return db
    .select()
    .from(properties)
    .where(eq(properties.managerId, managerId))
    .orderBy(asc(properties.name));
}

export async function getPropertyForManager(managerId: number, propertyId: number) {
  const db = getDb();
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.managerId, managerId)))
    .limit(1);
  return property ?? null;
}

export async function listTenantsForManager(managerId: number) {
  const db = getDb();
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      contactEmail: tenants.contactEmail,
      contactPhone: tenants.contactPhone,
      userId: tenants.userId,
      propertyId: tenants.propertyId,
      propertyName: properties.name,
    })
    .from(tenants)
    .innerJoin(properties, eq(properties.id, tenants.propertyId))
    .where(eq(properties.managerId, managerId))
    .orderBy(asc(tenants.name));
}

export async function listTenantsForProperty(managerId: number, propertyId: number) {
  const db = getDb();
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      contactEmail: tenants.contactEmail,
      contactPhone: tenants.contactPhone,
      userId: tenants.userId,
    })
    .from(tenants)
    .innerJoin(properties, eq(properties.id, tenants.propertyId))
    .where(and(eq(tenants.propertyId, propertyId), eq(properties.managerId, managerId)))
    .orderBy(asc(tenants.name));
}

export async function getTenantForManager(managerId: number, tenantId: number) {
  const db = getDb();
  const [row] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      contactEmail: tenants.contactEmail,
      contactPhone: tenants.contactPhone,
      userId: tenants.userId,
      propertyId: tenants.propertyId,
      propertyName: properties.name,
    })
    .from(tenants)
    .innerJoin(properties, eq(properties.id, tenants.propertyId))
    .where(and(eq(tenants.id, tenantId), eq(properties.managerId, managerId)))
    .limit(1);
  return row ?? null;
}

export async function listLeasesForTenant(managerId: number, tenantId: number) {
  const db = getDb();
  return db
    .select({
      id: leases.id,
      fileName: leases.fileName,
      status: leases.status,
      uploadedAt: leases.uploadedAt,
    })
    .from(leases)
    .innerJoin(properties, eq(properties.id, leases.propertyId))
    .where(and(eq(leases.tenantId, tenantId), eq(properties.managerId, managerId)))
    .orderBy(desc(leases.uploadedAt));
}

export async function getLeaseForManager(managerId: number, leaseId: number) {
  const db = getDb();
  const [row] = await db
    .select({
      id: leases.id,
      fileName: leases.fileName,
      rawText: leases.rawText,
      status: leases.status,
      uploadedAt: leases.uploadedAt,
      tenantId: leases.tenantId,
      propertyId: leases.propertyId,
      tenantName: tenants.name,
      propertyName: properties.name,
    })
    .from(leases)
    .innerJoin(tenants, eq(tenants.id, leases.tenantId))
    .innerJoin(properties, eq(properties.id, leases.propertyId))
    .where(and(eq(leases.id, leaseId), eq(properties.managerId, managerId)))
    .limit(1);
  return row ?? null;
}

export async function listObligationsForLease(leaseId: number) {
  const db = getDb();
  return db
    .select()
    .from(obligations)
    .where(eq(obligations.leaseId, leaseId))
    .orderBy(desc(obligations.createdAt));
}

export async function listRemindersForObligationIds(obligationIds: number[]) {
  if (obligationIds.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(reminders)
    .where(inArray(reminders.obligationId, obligationIds))
    .orderBy(asc(reminders.dueDate));
}

export async function listPendingObligationsForManager(managerId: number) {
  const db = getDb();
  return db
    .select({
      id: obligations.id,
      title: obligations.title,
      leaseId: obligations.leaseId,
      tenantName: tenants.name,
      propertyName: properties.name,
      createdAt: obligations.createdAt,
    })
    .from(obligations)
    .innerJoin(properties, eq(properties.id, obligations.propertyId))
    .innerJoin(tenants, eq(tenants.id, obligations.tenantId))
    .where(and(eq(properties.managerId, managerId), eq(obligations.status, "pending_review")))
    .orderBy(desc(obligations.createdAt));
}

export async function listRemindersForManager(managerId: number) {
  const db = getDb();
  return db
    .select({
      id: reminders.id,
      dueDate: reminders.dueDate,
      targetDate: reminders.targetDate,
      leadDays: reminders.leadDays,
      status: reminders.status,
      obligationTitle: obligations.title,
      obligationType: obligations.type,
      tenantName: tenants.name,
      propertyName: properties.name,
    })
    .from(reminders)
    .innerJoin(obligations, eq(obligations.id, reminders.obligationId))
    .innerJoin(properties, eq(properties.id, obligations.propertyId))
    .innerJoin(tenants, eq(tenants.id, obligations.tenantId))
    .where(eq(properties.managerId, managerId))
    .orderBy(asc(reminders.dueDate));
}

export async function listRemindersForTenant(tenantId: number) {
  const db = getDb();
  return db
    .select({
      id: reminders.id,
      dueDate: reminders.dueDate,
      targetDate: reminders.targetDate,
      leadDays: reminders.leadDays,
      status: reminders.status,
      obligationTitle: obligations.title,
      obligationDescription: obligations.description,
      obligationType: obligations.type,
    })
    .from(reminders)
    .innerJoin(obligations, eq(obligations.id, reminders.obligationId))
    .where(eq(obligations.tenantId, tenantId))
    .orderBy(asc(reminders.dueDate));
}

export async function getActiveObligationsForTenant(tenantId: number) {
  const db = getDb();
  return db
    .select()
    .from(obligations)
    .where(and(eq(obligations.tenantId, tenantId), eq(obligations.status, "approved")))
    .orderBy(desc(obligations.createdAt));
}

export async function listLeasesForTenantPortal(tenantId: number) {
  const db = getDb();
  return db
    .select({
      id: leases.id,
      fileName: leases.fileName,
      status: leases.status,
      uploadedAt: leases.uploadedAt,
    })
    .from(leases)
    .where(eq(leases.tenantId, tenantId))
    .orderBy(desc(leases.uploadedAt));
}
