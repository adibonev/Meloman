"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SpotifyTrack } from "@/lib/spotify";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function SpotifySearch({
  onSelect,
  label,
}: {
  onSelect: (track: SpotifyTrack) => void;
  label?: string;
}) {
  const t = useTranslations("SpotifySearch");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search. We track the latest query in a ref so a stale fetch
  // can't overwrite a more recent result if responses come back out of order.
  const latestQueryRef = useRef("");
  useEffect(() => {
    latestQueryRef.current = query;

    if (query.trim().length < MIN_QUERY_LENGTH) {
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          throw new Error("search failed");
        }
        const data = (await res.json()) as { tracks: SpotifyTrack[] };
        if (latestQueryRef.current === query) {
          setResults(data.tracks);
        }
      } catch {
        if (latestQueryRef.current === query) {
          setError(t("error"));
          setResults([]);
        }
      } finally {
        if (latestQueryRef.current === query) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query, t]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(track: SpotifyTrack) {
    onSelect(track);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  const showDropdown =
    isOpen &&
    (loading ||
      error !== null ||
      results.length > 0 ||
      query.trim().length >= MIN_QUERY_LENGTH);

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <Label htmlFor="spotify-search">{label ?? t("label")}</Label>
      <Input
        id="spotify-search"
        type="text"
        placeholder={t("placeholder")}
        value={query}
        onChange={(e) => {
          const nextQuery = e.target.value;
          setQuery(nextQuery);
          if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
            setResults([]);
            setError(null);
            setLoading(false);
          }
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) setIsOpen(true);
        }}
        autoComplete="off"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {t("loading")}
            </p>
          )}
          {error && !loading && (
            <p className="px-3 py-2 text-xs text-destructive">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {t("noResults")}
            </p>
          )}
          {!loading &&
            !error &&
            results.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelect(track)}
                className="flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
              >
                {track.albumCoverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 64px Spotify cover, admin-side preview only
                  <img
                    src={track.albumCoverUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <div className="size-10 shrink-0 rounded-sm bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{track.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {track.artistName}
                    {track.year !== null && ` · ${track.year}`}
                    {track.albumName && ` · ${track.albumName}`}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
