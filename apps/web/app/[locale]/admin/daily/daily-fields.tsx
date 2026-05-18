"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// Type select + JSON payload, client-side so switching the type swaps
// the editable template to match. The swap only happens while the
// textarea still holds one of the known templates (i.e. the admin
// hasn't started editing) so typed content is never wiped.
export function DailyFields({
  songTemplate,
  mysteryTemplate,
  typeLabel,
  songLabel,
  mysteryLabel,
  payloadLabel,
}: {
  songTemplate: string;
  mysteryTemplate: string;
  typeLabel: string;
  songLabel: string;
  mysteryLabel: string;
  payloadLabel: string;
}) {
  const [payload, setPayload] = useState(songTemplate);

  function onTypeChange(next: string) {
    const pristine =
      payload.trim() === songTemplate.trim() ||
      payload.trim() === mysteryTemplate.trim() ||
      payload.trim() === "";
    if (pristine) {
      setPayload(next === "mystery_artist" ? mysteryTemplate : songTemplate);
    }
  }

  return (
    <>
      <label className="block">
        <span className="text-sm text-muted-foreground">{typeLabel}</span>
        <select
          name="contentType"
          className={inputCls}
          defaultValue="song_of_day"
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="song_of_day">{songLabel}</option>
          <option value="mystery_artist">{mysteryLabel}</option>
        </select>
      </label>
      <label className="col-span-full block sm:col-span-2">
        <span className="text-sm text-muted-foreground">{payloadLabel}</span>
        <textarea
          name="payload"
          required
          rows={8}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className={`${inputCls} font-mono`}
        />
      </label>
    </>
  );
}
