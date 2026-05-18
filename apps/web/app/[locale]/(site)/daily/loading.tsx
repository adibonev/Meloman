// Route-segment skeleton shown while today's daily content streams.
export default function DailyLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16" aria-hidden>
      <div className="h-14 w-72 animate-pulse rounded bg-secondary" />
      <div className="mt-10 flex flex-col gap-6 sm:flex-row">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary sm:w-56" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
          <div className="h-24 w-full animate-pulse rounded bg-secondary" />
        </div>
      </div>
    </main>
  );
}
