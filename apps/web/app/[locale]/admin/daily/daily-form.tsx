"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DailyFields } from "./daily-fields";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export type DailyResult =
  | { ok: true }
  | { errorKey: "forbidden" | "invalid" }
  | null;

// Client form so the admin gets explicit success/error feedback. The
// underlying server action returns a result; without surfacing it the save
// looked silent (esp. on invalid JSON), which read as "nothing saved".
export function DailyForm({
  action,
  songTemplate,
  mysteryTemplate,
  labels,
}: {
  action: (prev: DailyResult, formData: FormData) => Promise<DailyResult>;
  songTemplate: string;
  mysteryTemplate: string;
  labels: {
    newEntry: string;
    date: string;
    type: string;
    song: string;
    mystery: string;
    payload: string;
    songHint: string;
    mysteryHint: string;
    save: string;
    saved: string;
    invalid: string;
    forbidden: string;
  };
}) {
  const [state, formAction, pending] = useActionState<DailyResult, FormData>(
    action,
    null
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-border p-6"
    >
      <h2 className="font-heading text-xl font-black uppercase">
        {labels.newEntry}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-muted-foreground">{labels.date}</span>
          <input name="contentDate" type="date" required className={inputCls} />
        </label>
        <DailyFields
          songTemplate={songTemplate}
          mysteryTemplate={mysteryTemplate}
          typeLabel={labels.type}
          songLabel={labels.song}
          mysteryLabel={labels.mystery}
          payloadLabel={labels.payload}
        />
      </div>
      <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <p className="mb-1">{labels.songHint}</p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3">
            {songTemplate}
          </pre>
        </div>
        <div>
          <p className="mb-1">{labels.mysteryHint}</p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3">
            {mysteryTemplate}
          </pre>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {labels.save}
        </Button>
        {state && "ok" in state && (
          <p className="text-sm font-medium text-primary">{labels.saved}</p>
        )}
        {state && "errorKey" in state && (
          <p className="text-sm font-medium text-destructive">
            {state.errorKey === "forbidden" ? labels.forbidden : labels.invalid}
          </p>
        )}
      </div>
    </form>
  );
}
