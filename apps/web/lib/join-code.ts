import { randomBytes } from "node:crypto";

// Human-friendly join codes for live quiz sessions. We avoid easily-confused
// glyphs (0/O, 1/I/L) so a code shouted across a noisy bar gets typed back
// correctly on a phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateJoinCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
