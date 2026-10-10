"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { OBLIGATION_TYPES, RECURRENCE_FREQUENCIES } from "@/lib/ai/schema";

type DueRuleDefaults =
  | { kind: "once"; date: string }
  | { kind: "recurring"; frequency: string; anchorDate: string };

export function ObligationFields({
  idPrefix,
  defaultType,
  defaultTitle,
  defaultDescription,
  defaultDueRule,
}: {
  idPrefix: string;
  defaultType?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultDueRule?: DueRuleDefaults;
}) {
  const [kind, setKind] = useState<"once" | "recurring">(defaultDueRule?.kind ?? "once");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-type`}>Type</Label>
        <NativeSelect id={`${idPrefix}-type`} name="type" defaultValue={defaultType ?? OBLIGATION_TYPES[0]}>
          {OBLIGATION_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {type.replaceAll("_", " ")}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input id={`${idPrefix}-title`} name="title" defaultValue={defaultTitle} required />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea id={`${idPrefix}-description`} name="description" defaultValue={defaultDescription} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-dueKind`}>Schedule</Label>
        <NativeSelect
          id={`${idPrefix}-dueKind`}
          name="dueKind"
          value={kind}
          onChange={(event) => setKind(event.target.value as "once" | "recurring")}
        >
          <NativeSelectOption value="once">One-time due date</NativeSelectOption>
          <NativeSelectOption value="recurring">Recurring</NativeSelectOption>
        </NativeSelect>
      </div>

      {kind === "once" ? (
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-dueDate`}>Due date</Label>
          <Input
            id={`${idPrefix}-dueDate`}
            name="dueDate"
            type="date"
            defaultValue={defaultDueRule?.kind === "once" ? defaultDueRule.date : undefined}
            required
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-dueFrequency`}>Frequency</Label>
            <NativeSelect
              id={`${idPrefix}-dueFrequency`}
              name="dueFrequency"
              defaultValue={defaultDueRule?.kind === "recurring" ? defaultDueRule.frequency : "ANNUALLY"}
            >
              {RECURRENCE_FREQUENCIES.map((frequency) => (
                <NativeSelectOption key={frequency} value={frequency}>
                  {frequency}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-dueAnchorDate`}>First occurrence</Label>
            <Input
              id={`${idPrefix}-dueAnchorDate`}
              name="dueAnchorDate"
              type="date"
              defaultValue={defaultDueRule?.kind === "recurring" ? defaultDueRule.anchorDate : undefined}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
}
