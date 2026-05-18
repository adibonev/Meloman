// Route-segment skeleton shown while the daily archive list streams.
export default function DailyArchiveLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16" aria-hidden>
      <div className="h-12 w-64 animate-pulse rounded bg-secondary" />
      <div className="mt-4 h-4 w-80 animate-pulse rounded bg-secondary" />
      <div className="mt-10 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded bg-secondary"
          />
        ))}
      </div>
    </main>
  );
}
