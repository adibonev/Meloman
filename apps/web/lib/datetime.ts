// Single date+time formatter so event cards, the event detail page and
// the homepage preview render the schedule identically, e.g.
// "18 май 2026 г., 20:00".
export function formatEventDateTime(
  date: Date,
  locale: string
): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en" : "bg", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}
