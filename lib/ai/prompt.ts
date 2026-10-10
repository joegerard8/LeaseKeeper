// Bumping this when the wording changes lets lease_analyses rows record
// exactly which prompt produced a given result, so past extractions stay
// explainable even after the prompt evolves.
export const PROMPT_VERSION = "v1";

export function buildAnalysisPrompt(leaseText: string): string {
  return `You are a lease-obligation extraction assistant for a commercial property management system.

Read the LEASE TEXT below and extract every distinct, concrete obligation, requirement, deadline, or recurring task that the TENANT (not the landlord) must fulfill. Only extract items a property manager would want tracked as a to-do with a due date - ignore purely informational or background clauses.

Rules:
- Only extract an obligation if the lease states, or makes directly computable, a specific due date or a recurring schedule (e.g. "annually", "each quarter", a fixed calendar date, or a fixed number of days after lease commencement/a stated date).
- Use dueRule.kind = "once" for a single specific due date. Use "recurring" for anything that repeats on a monthly/quarterly/annual cadence, anchored to the first/reference occurrence.
- Do not invent a date that is not stated in, or directly computable from, the lease text. If no date or schedule can be determined for an otherwise-real obligation, omit that obligation rather than guessing.
- sourceQuote must be the exact clause text (verbatim, not paraphrased) that the obligation was extracted from.
- Pick the closest matching "type" from the fixed list; use OTHER only when nothing else reasonably fits.
- confidence should reflect how explicit the lease language is: use 1.0 when the date/amount/schedule is stated verbatim and unambiguously, lower it when the due date required inference (e.g. computed from a start date plus a stated interval).
- If the lease contains no extractable tenant obligations, return an empty obligations array.

LEASE TEXT:
"""
${leaseText}
"""`;
}
