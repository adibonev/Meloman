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

// --- Live quiz (native player) ---

export type PlayTeam = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  totalScore: number;
  isActive: boolean;
};

export type PlayQuestion = {
  id: string;
  questionType:
    | "multiple_choice"
    | "open_text"
    | "audio"
    | "image_reveal"
    | "lyric_blank"
    | "decade";
  questionText: string;
  options: string[];
  maxPoints: number;
  timeLimitSeconds: number;
  blankCount: number;
  signedImageUrl: string | null;
  mediaBlurPx: number | null;
  mediaAttribution: string | null;
  correctAnswerLabel: string | null;
};

export type PlayState = {
  status:
    | "lobby"
    | "active"
    | "reveal"
    | "between_rounds"
    | "paused"
    | "finished";
  serverNowMs: number;
  timerEndsAtMs: number | null;
  joinable: boolean;
  myTeam: {
    id: string;
    name: string;
    color: string;
    avatarEmoji: string;
    isCaptain: boolean;
  } | null;
  teams: PlayTeam[];
  members: { id: string; name: string; isCaptain: boolean; isYou: boolean }[];
  question: PlayQuestion | null;
  hasSubmitted: boolean;
  teamResult: {
    isCorrect: boolean;
    pointsAwarded: number;
    submittedAnswer: unknown;
  } | null;
  isEliminated: boolean;
  cutoffApplied: boolean;
};

export function getPlayState(code: string) {
  return request<PlayState>(
    `/api/sessions/${encodeURIComponent(code)}/play`,
    { auth: true }
  );
}

export function createTeam(
  code: string,
  name: string,
  deviceFingerprint: string
) {
  return request<{ ok: true; teamId: string }>(
    `/api/sessions/${encodeURIComponent(code)}/teams`,
    {
      method: "POST",
      auth: true,
      body: { action: "create", name, deviceFingerprint },
    }
  );
}

export function joinTeam(
  code: string,
  teamId: string,
  deviceFingerprint: string
) {
  return request<{ ok: true; teamId: string }>(
    `/api/sessions/${encodeURIComponent(code)}/teams`,
    {
      method: "POST",
      auth: true,
      body: { action: "join", teamId, deviceFingerprint },
    }
  );
}

// Payload mirrors the server's submitAnswerSchema discriminated union.
export type SubmitAnswerPayload =
  | { questionType: "multiple_choice"; optionIndex: number }
  | { questionType: "open_text"; textAnswer: string }
  | { questionType: "audio"; textAnswer: string }
  | { questionType: "image_reveal"; textAnswer: string }
  | { questionType: "lyric_blank"; lyricAnswers: string[] }
  | { questionType: "decade"; decade: number; year: number };

export function submitAnswer(code: string, payload: SubmitAnswerPayload) {
  return request<{ ok: true }>(
    `/api/sessions/${encodeURIComponent(code)}/answer`,
    { method: "POST", auth: true, body: payload }
  );
}
