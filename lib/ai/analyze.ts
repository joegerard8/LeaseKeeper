import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { getDb } from "@/db";
import { leaseAnalyses, leases, obligations } from "@/db/schema";
import { analysisResponseSchema } from "./gemini-schema";
import { buildAnalysisPrompt, PROMPT_VERSION } from "./prompt";
import { analysisResultSchema } from "./schema";

// Fixed seed + temperature 0 + tight top-p/top-k: Gemini's docs describe this
// as "best effort" determinism, not a hard guarantee, which is exactly why
// nothing downstream trusts the model's output directly - see the Zod
// re-validation below and the deterministic reminder mapping in
// lib/reminders.ts.
const SEED = 42;
const MAX_ATTEMPTS = 2;

function getModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local to enable lease analysis.",
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function callGemini(leaseText: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: buildAnalysisPrompt(leaseText),
    config: {
      temperature: 0,
      topP: 0.1,
      topK: 1,
      seed: SEED,
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

// Layer 1 of the AI feature: one bounded, schema-constrained extraction call
// per lease. Everything after this (review, approval, reminder scheduling)
// is deterministic application code - see lib/reminders.ts for Layer 2.
export async function analyzeLease(leaseId: number): Promise<void> {
  const db = getDb();
  const [lease] = await db.select().from(leases).where(eq(leases.id, leaseId)).limit(1);
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }

  await db.update(leases).set({ status: "analyzing" }).where(eq(leases.id, leaseId));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let rawResponse = "";
    try {
      rawResponse = await callGemini(lease.rawText);
      const parsedJson: unknown = JSON.parse(rawResponse);
      const result = analysisResultSchema.parse(parsedJson);

      await db.insert(leaseAnalyses).values({
        leaseId,
        model: getModelName(),
        promptVersion: PROMPT_VERSION,
        rawResponse,
        status: "success",
      });

      if (result.obligations.length > 0) {
        await db.insert(obligations).values(
          result.obligations.map((candidate) => ({
            leaseId,
            tenantId: lease.tenantId,
            propertyId: lease.propertyId,
            type: candidate.type,
            title: candidate.title,
            description: candidate.description,
            sourceQuote: candidate.sourceQuote,
            dueRule: JSON.stringify(candidate.dueRule),
            confidence: candidate.confidence,
            status: "pending_review" as const,
          })),
        );
      }

      await db.update(leases).set({ status: "analyzed" }).where(eq(leases.id, leaseId));
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await db.insert(leaseAnalyses).values({
        leaseId,
        model: getModelName(),
        promptVersion: PROMPT_VERSION,
        rawResponse,
        status: rawResponse ? "invalid_response" : "error",
        errorMessage,
      });
      // Falls through to the next attempt (same deterministic params, to
      // shake off a transient hiccup), or to the failure path below once
      // MAX_ATTEMPTS is exhausted.
    }
  }

  await db.update(leases).set({ status: "analysis_failed" }).where(eq(leases.id, leaseId));
}
