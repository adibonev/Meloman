// Wikipedia metadata helper. Used as an admin-only autofill source for the
// Image Reveal question form: search by artist/topic name → returns
// thumbnail + intro + page URL → admin picks → form pulls the thumbnail
// into the upload pipeline and pre-fills source/attribution.
//
// Wikipedia REST/Action APIs are public (no auth). We hit en.wikipedia.org
// because the music catalogue is most complete there; bg.wikipedia.org is a
// possible future locale-aware addition.

const ACTION_API = "https://en.wikipedia.org/w/api.php";

export type WikipediaResult = {
  title: string;
  pageUrl: string;
  extract: string;
  thumbnailUrl: string | null;
  attribution: string;
};

type RawPage = {
  pageid: number;
  title: string;
  fullurl?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  index?: number;
};

export async function searchPages(
  query: string,
  limit = 5
): Promise<WikipediaResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  // Single round-trip: generator=search runs a fulltext search and feeds
  // matched pages into prop=pageimages|extracts|info so we get titles +
  // thumbnails + intro snippets in one response.
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: trimmed,
    gsrlimit: String(limit),
    prop: "pageimages|extracts|info",
    piprop: "thumbnail",
    pithumbsize: "200",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    inprop: "url",
  });
  const url = `${ACTION_API}?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      // Wikipedia asks API consumers to identify themselves; otherwise
      // requests can be rate-limited or blocked.
      "User-Agent":
        "Meloman/0.1 (https://github.com/adibonev/meloman; meloman dev)",
    },
  });

  if (!res.ok) {
    throw new Error(`Wikipedia search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    query?: { pages?: RawPage[] };
  };
  const pages = data.query?.pages ?? [];

  // The API doesn't sort by gsrsearch index in formatversion 2; sort by it
  // ourselves so the most relevant hit lands first.
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

  return pages.map((page) => ({
    title: page.title,
    pageUrl: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    extract: page.extract ?? "",
    thumbnailUrl: page.thumbnail?.source ?? null,
    // Generic attribution. Wikipedia images are typically CC BY-SA 3.0/4.0
    // but vary per file; we don't try to parse the licence from the page.
    // Admin should verify the source page before publishing.
    attribution: `Image from Wikipedia (${page.title}). See ${page.fullurl ?? "wikipedia.org"} for license details.`,
  }));
}
