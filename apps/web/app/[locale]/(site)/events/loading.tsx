// Route-segment skeleton shown while the events list streams.
export default function EventsLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16" aria-hidden>
      <div className="h-14 w-64 animate-pulse rounded bg-secondary" />
      <div className="mt-4 h-4 w-72 animate-pulse rounded bg-secondary" />
      <div className="mt-10 h-28 w-full animate-pulse rounded-lg bg-secondary" />
      <div className="mt-12 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded bg-secondary"
          />
        ))}
      </div>
    </main>
  );
}
