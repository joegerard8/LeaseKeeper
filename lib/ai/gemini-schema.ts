import { Schema, Type } from "@google/genai";
import { OBLIGATION_TYPES, RECURRENCE_FREQUENCIES } from "./schema";

// Mirrors lib/ai/schema.ts's Zod schema as a Gemini structured-output
// schema. This constrains the model's *shape* (closed enums, required
// fields); the Zod schema is still the final authority once the response
// comes back - Gemini's constrained decoding is a best-effort assist, not a
// substitute for server-side validation.
const dueRuleGeminiSchema: Schema = {
  anyOf: [
    {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, enum: ["once"] },
        date: {
          type: Type.STRING,
          description: "The single due date, as an ISO date YYYY-MM-DD.",
        },
      },
      required: ["kind", "date"],
    },
    {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, enum: ["recurring"] },
        frequency: { type: Type.STRING, enum: [...RECURRENCE_FREQUENCIES] },
        anchorDate: {
          type: Type.STRING,
          description:
            "ISO date YYYY-MM-DD of the first/reference occurrence this recurrence is anchored to.",
        },
      },
      required: ["kind", "frequency", "anchorDate"],
    },
  ],
};

export const analysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    obligations: {
      type: Type.ARRAY,
      description:
        "Every distinct tenant obligation found in the lease that has a clear or reasonably inferable due date or recurring schedule.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [...OBLIGATION_TYPES],
            description: "Closest matching obligation category. Use OTHER only if nothing else fits.",
          },
          title: {
            type: Type.STRING,
            description: "Short human-readable title, e.g. 'Certificate of insurance renewal'.",
          },
          description: {
            type: Type.STRING,
            description: "One or two plain-language sentences explaining what the tenant must do.",
          },
          dueRule: dueRuleGeminiSchema,
          sourceQuote: {
            type: Type.STRING,
            description: "The exact clause text this obligation was extracted from, quoted verbatim from the lease.",
          },
          confidence: {
            type: Type.NUMBER,
            description:
              "0 to 1. 1.0 means the date/amount/schedule is stated explicitly and unambiguously; lower if inferred.",
          },
        },
        required: ["type", "title", "description", "dueRule", "sourceQuote", "confidence"],
      },
    },
  },
  required: ["obligations"],
};
