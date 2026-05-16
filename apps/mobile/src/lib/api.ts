import Constants from "expo-constants";
import { getToken } from "./auth";

/**
 * Base URL of the Meloman web API. Set via app.json → expo.extra.apiBaseUrl
 * (LAN IP in dev so a real phone/emulator can reach the dev machine; the
 * Vercel URL in production). EXPO_PUBLIC_API_BASE_URL overrides it.
 */
function baseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
    "http://localhost:3000"
  );
}

export type ApiError = { code: string; message: string };

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as
    | (T & { error?: ApiError })
    | null;

  if (!res.ok || !json) {
    const err = json?.error;
    throw new Error(err?.message ?? `Request failed (${res.status})`);
  }
  return json;
}

// --- Endpoints (the Phase 1 REST surface) ---

export type StoryListItem = {
  slug: string;
  title: string;
  subtitle: string | null;
  artistName: string | null;
  readingTimeMinutes: number;
};

export function listStories() {
  return request<{ stories: StoryListItem[] }>("/api/stories");
}

export type StoryDetail = StoryListItem & {
  body: string;
  youtubeUrl: string | null;
  spotifyUri: string | null;
};

export function getStory(slug: string) {
  return request<{ story: StoryDetail }>(
    `/api/stories/${encodeURIComponent(slug)}`
  );
}

export type DailyToday = {
  daily: {
    contentType: "song_of_day" | "mystery_artist";
    contentDate: string;
    payload: Record<string, unknown>;
  } | null;
};

export function getDailyToday() {
  return request<DailyToday>("/api/daily/today");
}

export type LoginResult = {
  token: string;
  user: { id: string; email: string; name: string; role: string };
};

export function mobileLogin(email: string, password: string) {
  return request<LoginResult>("/api/auth/mobile-login", {
    method: "POST",
    body: { email, password },
  });
}

export type Progress = {
  progress: {
    totalXp: number;
    streak: number;
    badges: { slug: string; name: string }[];
  };
};

export function getProgress() {
  return request<Progress>("/api/users/me/progress", { auth: true });
}

export type SessionState = {
  session: {
    id: string;
    status: string;
    currentQuestionId: string | null;
  };
  serverNow: number;
};

export function getSession(code: string) {
  return request<SessionState>(
    `/api/sessions/${encodeURIComponent(code)}`,
    { auth: true }
  );
}
