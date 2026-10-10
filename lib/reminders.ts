import { addDays, addMonths, addQuarters, addYears, format, isBefore, parseISO } from "date-fns";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { obligations, reminders } from "@/db/schema";
import { dueRuleSchema, type DueRule, type RecurrenceFrequency } from "@/lib/ai/schema";

export type ReminderPlan = {
  targetDate: string; // YYYY-MM-DD - the actual obligation occurrence due date
  leadDays: number; // 30 / 7 / 1
  dueDate: string; // YYYY-MM-DD - targetDate minus leadDays
};

const LEAD_DAYS_SCHEDULE = [30, 7, 1] as const;
const RECURRING_OCCURRENCES = 4;

function stepByFrequency(date: Date, frequency: RecurrenceFrequency): Date {
  switch (frequency) {
    case "MONTHLY":
      return addMonths(date, 1);
    case "QUARTERLY":
      return addQuarters(date, 1);
    case "ANNUALLY":
      return addYears(date, 1);
  }
}

function remindersForTargetDate(targetDate: Date): ReminderPlan[] {
  const targetIso = format(targetDate, "yyyy-MM-dd");
  return LEAD_DAYS_SCHEDULE.map((leadDays) => ({
    targetDate: targetIso,
    leadDays,
    dueDate: format(addDays(targetDate, -leadDays), "yyyy-MM-dd"),
  }));
}

/**
 * Layer 2 of the AI feature: a pure, deterministic mapping from an approved
 * obligation's dueRule to concrete reminders. No model call happens here -
 * this function is what actually satisfies "AI output -> deterministic
 * notification/action mapping". Same (dueRule, referenceDate) in, same
 * reminders out, every time.
 */
export function mapDueRuleToReminders(
  dueRule: DueRule,
  referenceDate: Date = new Date(),
): ReminderPlan[] {
  if (dueRule.kind === "once") {
    return remindersForTargetDate(parseISO(dueRule.date));
  }

  // Walk forward from anchorDate until we reach the first occurrence on or
  // after referenceDate, then schedule the next few occurrences from there.
  let occurrence = parseISO(dueRule.anchorDate);
  while (isBefore(occurrence, referenceDate)) {
    occurrence = stepByFrequency(occurrence, dueRule.frequency);
  }

  const plans: ReminderPlan[] = [];
  for (let i = 0; i < RECURRING_OCCURRENCES; i++) {
    plans.push(...remindersForTargetDate(occurrence));
    occurrence = stepByFrequency(occurrence, dueRule.frequency);
  }
  return plans;
}

/**
 * Approves a pending_review/manual obligation and generates its reminders.
 * This is the only place reminders get created - obligations never produce
 * tenant-visible reminders until a human has approved them.
 */
export async function approveObligationAndScheduleReminders(
  obligationId: number,
  reviewedBy: number,
): Promise<void> {
  const db = getDb();
  const [obligation] = await db
    .select()
    .from(obligations)
    .where(eq(obligations.id, obligationId))
    .limit(1);
  if (!obligation) {
    throw new Error(`Obligation ${obligationId} not found`);
  }

  const dueRule = dueRuleSchema.parse(JSON.parse(obligation.dueRule));
  const plans = mapDueRuleToReminders(dueRule);

  if (plans.length > 0) {
    await db.insert(reminders).values(
      plans.map((plan) => ({
        obligationId,
        targetDate: plan.targetDate,
        leadDays: plan.leadDays,
        dueDate: plan.dueDate,
      })),
    );
  }

  await db
    .update(obligations)
    .set({ status: "approved", reviewedAt: new Date().toISOString(), reviewedBy })
    .where(eq(obligations.id, obligationId));
}
