// Spotify metadata helper. Used as an admin-only autofill source per
// CLAUDE.md §4.8: Search API + track/artist metadata are OK for admin
// helpers; Embed widget, Web Playback SDK and any user-facing display of
// album/artist art are forbidden.

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

export type SpotifyTrack = {
  id: string;
  name: string;
  artistName: string;
  year: number | null;
  albumName: string;
  // Returned for admin-side preview only — DO NOT render on player-facing
  // pages. CLAUDE.md §4.8 forbids displaying Spotify-sourced album art in
  // the user-facing UI.
  albumCoverUrl: string | null;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Early-refresh 60 sec before expiry so we never hand out an almost-stale
  // token to a request that will arrive at Spotify after it has rotated.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment."
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export async function searchTracks(
  query: string,
  limit = 8
): Promise<SpotifyTrack[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const token = await getAccessToken();
  const url = `${SEARCH_URL}?q=${encodeURIComponent(trimmed)}&type=track&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  type SpotifyApiTrack = {
    id: string;
    name: string;
    album: {
      name: string;
      release_date: string;
      images: { url: string; width: number; height: number }[];
    };
    artists: { name: string }[];
  };

  const data = (await res.json()) as {
    tracks?: { items?: SpotifyApiTrack[] };
  };
  const items = data.tracks?.items ?? [];

  return items.map((t) => {
    const yearStr = t.album.release_date?.slice(0, 4);
    const year = /^\d{4}$/.test(yearStr) ? Number(yearStr) : null;
    // Pick the smallest image >=64px to keep dropdown light; fall back to
    // the first image or null.
    const cover =
      t.album.images.find((img) => img.width >= 64 && img.width <= 200)?.url ??
      t.album.images[t.album.images.length - 1]?.url ??
      null;
    return {
      id: t.id,
      name: t.name,
      artistName: t.artists.map((a) => a.name).join(", "),
      year,
      albumName: t.album.name,
      albumCoverUrl: cover,
    };
  });
}
