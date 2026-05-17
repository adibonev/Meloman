// Pure parser for what a scanned quiz QR contains. The host /present
// QR encodes the full join URL (e.g. https://host/play/MELO42 or
// .../en/play/melo42?x=1); a player might also paste a raw code. We
// extract and normalise the join code, or return null if it isn't one.

const CODE_RE = /^[A-Z0-9]{4,8}$/;

export function parseJoinCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let candidate = raw.trim();

  // Pull the segment after /play/ when it's a URL.
  const m = candidate.match(/\/play\/([^/?#]+)/i);
  if (m) candidate = m[1];

  candidate = candidate.replace(/[/?#].*$/, "").trim().toUpperCase();
  return CODE_RE.test(candidate) ? candidate : null;
}
