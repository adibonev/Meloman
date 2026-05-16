import { headers } from "next/headers";

/**
 * Absolute origin of the current request (e.g. https://meloman-web.vercel.app).
 *
 * Used to build scannable links such as the player-join QR code, which must be
 * absolute so a phone's camera opens the right host. Reads the forwarded
 * headers Vercel sets in front of the app; falls back to the raw Host header
 * (and http for localhost) in local dev.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
