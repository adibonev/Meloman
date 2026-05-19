// Pure event classifier shared by the events list, the event detail
// page and the homepage preview, so "upcoming / live / past" is decided
// in exactly one place.
//
// Rule (per product decision 2026-05-19):
//   - upcoming: start is in the future
//   - live:     start is in the past AND end is still in the future
//   - past:     end is in the past
//
// `scheduledStartAt` is the host-declared planned start. We fall back to
// the real `startedAt` (set when the host clicks Start), then to
// `createdAt`, so legacy rows without a schedule still classify sanely
// and a yesterday event never lingers as "upcoming". A `finished`
// session is always past regardless of the clock. When no end is known
// we assume a 3-hour event.

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export type EventStatusInput = {
  status: string;
  scheduledStartAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  startedAt: Date | string | null;
  createdAt: Date | string;
};

export type EventStatus = "upcoming" | "live" | "past";

function toMs(value: Date | string | null): number | null {
  if (value === null) return null;
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function eventStartMs(e: EventStatusInput): number {
  return (
    toMs(e.scheduledStartAt) ??
    toMs(e.startedAt) ??
    (toMs(e.createdAt) as number)
  );
}

export function classifyEvent(
  e: EventStatusInput,
  now: number = Date.now()
): EventStatus {
  if (e.status === "finished") return "past";

  const start = eventStartMs(e);
  const end = toMs(e.scheduledEndAt) ?? start + DEFAULT_DURATION_MS;

  if (now < start) return "upcoming";
  if (now < end) return "live";
  return "past";
}
