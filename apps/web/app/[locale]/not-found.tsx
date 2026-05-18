import Link from "next/link";

// Friendly 404 with a music wink instead of the default Next page.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-heading text-7xl font-black uppercase tracking-wider">
        404
      </p>
      <p className="max-w-md text-lg text-muted-foreground">
        Тази страница я няма в плейлиста. Може да е спряна или просто
        никога не е свирила тук.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
      >
        Към началото
      </Link>
    </main>
  );
}
