/**
 * @jest-environment node
 */

import { auth } from "@/auth";
import { searchTracks, type SpotifyTrack } from "@/lib/spotify";
import type { Session } from "next-auth";
import { GET } from "./route";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/spotify", () => ({
  searchTracks: jest.fn(),
}));

const authMock = auth as unknown as jest.MockedFunction<
  () => Promise<Session | null>
>;
const searchTracksMock = jest.mocked(searchTracks);

function session(role: "admin" | "player" | "super_admin" = "admin"): Session {
  return {
    user: {
      id: "user-1",
      email: "adi@example.com",
      name: "Adi",
      role,
    },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

function request(query: string): Request {
  return new Request(`http://localhost/api/spotify/search?${query}`);
}

describe("GET /api/spotify/search", () => {
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 when the user is not signed in", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "unauthorized", message: "Not signed in." },
    });
    expect(searchTracksMock).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin users", async () => {
    authMock.mockResolvedValue(session("player"));

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "forbidden", message: "Admin access required." },
    });
    expect(searchTracksMock).not.toHaveBeenCalled();
  });

  it("skips Spotify for queries shorter than two characters", async () => {
    authMock.mockResolvedValue(session());

    const response = await GET(request("q=q"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tracks: [] });
    expect(searchTracksMock).not.toHaveBeenCalled();
  });

  it("returns tracks for admins", async () => {
    const tracks: SpotifyTrack[] = [
      {
        id: "track-1",
        name: "Bohemian Rhapsody",
        artistName: "Queen",
        year: 1975,
        albumName: "A Night at the Opera",
        albumCoverUrl: "https://example.com/cover.jpg",
      },
    ];
    authMock.mockResolvedValue(session("super_admin"));
    searchTracksMock.mockResolvedValue(tracks);

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tracks });
    expect(searchTracksMock).toHaveBeenCalledWith("queen", 8);
  });

  it("returns 502 when Spotify search fails", async () => {
    authMock.mockResolvedValue(session());
    searchTracksMock.mockRejectedValue(new Error("Spotify unavailable"));

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "spotifyError",
        message: "Spotify search failed.",
      },
    });
  });
});
