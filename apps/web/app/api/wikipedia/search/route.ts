import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchPages } from "@/lib/wikipedia";

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
    return NextResponse.json({ pages: [] });
  }

  try {
    const pages = await searchPages(query, 5);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error("Wikipedia search failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "wikipediaError",
          message: "Wikipedia search failed.",
        },
      },
      { status: 502 }
    );
  }
}
