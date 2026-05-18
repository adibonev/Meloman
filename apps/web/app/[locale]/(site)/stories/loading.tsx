// Route-segment skeleton shown while the stories list streams.
export default function StoriesLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16" aria-hidden>
      <div className="h-12 w-64 animate-pulse rounded bg-secondary" />
      <div className="mt-10 aspect-[21/9] w-full animate-pulse rounded-lg bg-secondary" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-lg bg-secondary"
          />
        ))}
      </div>
    </main>
  );
}
