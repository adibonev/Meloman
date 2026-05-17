import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * GET /api/cron/daily-revalidate — Vercel Cron hook that busts any
 * cached /daily HTML at the Mystery Artist stage boundaries (10/14/18/
 * 22 Sofia, see vercel.json). Correctness itself comes from the
 * server-time stage calc in lib/daily-stage.ts (the page is dynamic);
 * this just guarantees a freshly-rendered page right at the flip even
 * if a CDN/ISR layer ever caches it.
 *
 * Secured with CRON_SECRET — Vercel Cron sends it as a Bearer token.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Bad cron secret." } },
      { status: 401 }
    );
  }

  // BG default has no locale prefix; EN is under /en.
  revalidatePath("/daily");
  revalidatePath("/en/daily");

  return NextResponse.json({
    status: "ok",
    revalidated: ["/daily", "/en/daily"],
    at: new Date().toISOString(),
  });
}
