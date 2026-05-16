import * as SecureStore from "expo-secure-store";

// Stable per-device id for the live-quiz anti-cheat
// (UNIQUE(team_id, device_fingerprint) — CLAUDE.md §4.9). Not a secret,
// just a device tag, so a plain random hex is fine. Persisted in
// secure-store so it survives app restarts within the same install.
const DEVICE_KEY = "meloman.deviceId";

function randomHex(length: number): string {
  let out = "";
  while (out.length < length) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out.slice(0, length);
}

export async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing && existing.length >= 8) return existing;
  const id = randomHex(32);
  await SecureStore.setItemAsync(DEVICE_KEY, id);
  return id;
}
