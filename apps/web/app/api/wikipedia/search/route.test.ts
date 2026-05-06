/**
 * @jest-environment node
 */

import { auth } from "@/auth";
import { searchPages, type WikipediaResult } from "@/lib/wikipedia";
import type { Session } from "next-auth";
import { GET } from "./route";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/wikipedia", () => ({
  searchPages: jest.fn(),
}));

const authMock = auth as unknown as jest.MockedFunction<
  () => Promise<Session | null>
>;
const searchPagesMock = jest.mocked(searchPages);

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
  return new Request(`http://localhost/api/wikipedia/search?${query}`);
}

describe("GET /api/wikipedia/search", () => {
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
    expect(searchPagesMock).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin users", async () => {
    authMock.mockResolvedValue(session("player"));

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "forbidden", message: "Admin access required." },
    });
    expect(searchPagesMock).not.toHaveBeenCalled();
  });

  it("skips Wikipedia for queries shorter than two characters", async () => {
    authMock.mockResolvedValue(session());

    const response = await GET(request("q=q"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ pages: [] });
    expect(searchPagesMock).not.toHaveBeenCalled();
  });

  it("returns pages for admins", async () => {
    const pages: WikipediaResult[] = [
      {
        title: "Queen (band)",
        pageUrl: "https://en.wikipedia.org/wiki/Queen_(band)",
        extract: "Queen are a British rock band.",
        thumbnailUrl: "https://example.com/queen.jpg",
        attribution: "Image from Wikipedia.",
      },
    ];
    authMock.mockResolvedValue(session("super_admin"));
    searchPagesMock.mockResolvedValue(pages);

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ pages });
    expect(searchPagesMock).toHaveBeenCalledWith("queen", 5);
  });

  it("returns 502 when Wikipedia search fails", async () => {
    authMock.mockResolvedValue(session());
    searchPagesMock.mockRejectedValue(new Error("Wikipedia unavailable"));

    const response = await GET(request("q=queen"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "wikipediaError",
        message: "Wikipedia search failed.",
      },
    });
  });
});
