"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Scannable player-join QR. CLAUDE.md §3.1: players scan a QR shown on the
 * TV to reach `/play/[code]`.
 *
 * Rendered on a solid light tile (not the dark theme background) — phone
 * cameras need high contrast between the modules and the quiet zone, and a
 * dark-on-dark QR is effectively unscannable. SVG keeps it crisp at any TV
 * size. `level="M"` tolerates ~15% damage, plenty for a screen photo.
 */
export function JoinQr({
  url,
  size = 180,
}: {
  url: string;
  size?: number;
}) {
  return (
    <div className="inline-block rounded-xl bg-white p-3 shadow-lg">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
        marginSize={0}
      />
    </div>
  );
}
