import { z } from "zod";

// The full set of obligation "kinds" the AI is allowed to choose from. Kept
// as a closed enum (not free text) so downstream code, UI, and the
// deterministic reminder mapper never have to deal with an unbounded set of
// obligation types.
export const OBLIGATION_TYPES = [
  "INSURANCE_CERTIFICATE",
  "RENT_PAYMENT",
  "MAINTENANCE_SERVICE",
  "INSPECTION",
  "NOTICE",
  "OTHER",
] as const;
export type ObligationType = (typeof OBLIGATION_TYPES)[number];

export const RECURRENCE_FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUALLY"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date in YYYY-MM-DD form");

// The AI is only ever allowed to pick one of these two shapes. Everything
// about *when* a reminder actually fires is computed later by plain
// deterministic code (see lib/reminders.ts) - the model never decides that.
export const dueRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("once"), date: isoDate }),
  z.object({
    kind: z.literal("recurring"),
    frequency: z.enum(RECURRENCE_FREQUENCIES),
    anchorDate: isoDate,
  }),
]);
export type DueRule = z.infer<typeof dueRuleSchema>;

export const obligationCandidateSchema = z.object({
  type: z.enum(OBLIGATION_TYPES),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  dueRule: dueRuleSchema,
  sourceQuote: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
});
export type ObligationCandidate = z.infer<typeof obligationCandidateSchema>;

export const analysisResultSchema = z.object({
  obligations: z.array(obligationCandidateSchema).max(50),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
