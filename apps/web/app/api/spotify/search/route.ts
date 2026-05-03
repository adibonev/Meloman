import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchTracks } from "@/lib/spotify";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Not signed in." } },
      { status: 401 }
    );
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Admin access required." } },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    // Avoid round-tripping to Spotify for incomplete queries; the dropdown
    // is hidden client-side until the user has typed something meaningful.
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await searchTracks(query, 8);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("Spotify search failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "spotifyError",
          message: "Spotify search failed.",
        },
      },
      { status: 502 }
    );
  }
}
