import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["manager", "tenant"] }).notNull(),
  name: text("name").notNull(),
  // True for a tenant account right after a manager creates or resets it
  // (there's no email delivery in this MVP, so the manager hands off a
  // temp password out of band) - forces a password change before the
  // account can reach /dashboard or /portal.
  mustResetPassword: integer("must_reset_password", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  managerId: integer("manager_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tenants = sqliteTable("tenants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  // Set once a manager creates a portal login for this tenant. Kept
  // one-directional (tenants -> users) so users/tenants don't need a
  // circular foreign key pair.
  userId: integer("user_id").references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leases = sqliteTable("leases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  rawText: text("raw_text").notNull(),
  status: text("status", {
    enum: ["uploaded", "analyzing", "analyzed", "analysis_failed"],
  })
    .notNull()
    .default("uploaded"),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leaseAnalyses = sqliteTable("lease_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leaseId: integer("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  rawResponse: text("raw_response").notNull(),
  status: text("status", {
    enum: ["success", "invalid_response", "error"],
  }).notNull(),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const obligations = sqliteTable("obligations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leaseId: integer("lease_id")
    .notNull()
    .references(() => leases.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "INSURANCE_CERTIFICATE",
      "RENT_PAYMENT",
      "MAINTENANCE_SERVICE",
      "INSPECTION",
      "NOTICE",
      "OTHER",
    ],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sourceQuote: text("source_quote").notNull(),
  // JSON-encoded DueRule (see lib/ai/schema.ts): either
  // { kind: "once", date } or { kind: "recurring", frequency, anchorDate }.
  dueRule: text("due_rule").notNull(),
  confidence: real("confidence").notNull().default(1),
  status: text("status", {
    enum: ["pending_review", "approved", "rejected", "manual"],
  })
    .notNull()
    .default("manual"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
});

export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  obligationId: integer("obligation_id")
    .notNull()
    .references(() => obligations.id, { onDelete: "cascade" }),
  // The actual obligation occurrence date this reminder is counting down to.
  targetDate: text("target_date").notNull(),
  // How many days before targetDate this reminder fires (30 / 7 / 1).
  leadDays: integer("lead_days").notNull(),
  // targetDate - leadDays. The date this reminder should surface in-app.
  dueDate: text("due_date").notNull(),
  status: text("status", {
    enum: ["pending", "done", "dismissed"],
  })
    .notNull()
    .default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
