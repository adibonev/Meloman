// Stable per-device identifier used as the anti-cheat key on team_members
// (UNIQUE(team_id, device_fingerprint)). Generated lazily and persisted in
// localStorage — survives page reloads and team switches within a single
// browser, but resets if the user clears storage or switches device.
//
// We deliberately do NOT use FingerprintJS here: the live-quiz attack model
// is "the same phone joins two teams to inflate score", which a localStorage
// UUID handles fine. A real cross-browser fingerprint would only matter if
// we tried to ban specific players — out of scope for an in-bar quiz.

const KEY = "meloman:device-fp";

export function getDeviceFingerprint(): string {
  // SSR-safety: callers should only invoke from "use client" components.
  // Throwing here surfaces accidental server-side usage early.
  if (typeof window === "undefined") {
    throw new Error("getDeviceFingerprint() requires the browser.");
  }
  let value = window.localStorage.getItem(KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(KEY, value);
  }
  return value;
}
