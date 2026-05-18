import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation — its methods throw in a
// browser. The Expo web export (meloman-mobile.vercel.app) still needs
// to persist the JWT and the device id, so on web we use localStorage.
//
// But in-app browsers (Messenger / Facebook webview) sandbox or wipe
// localStorage between navigations, which logged the user out the
// moment they switched tabs. So on web we ALSO keep an in-memory cache:
// within one app session (SPA navigation, no full reload) the token
// survives regardless of how flaky storage is, and localStorage is
// still used for persistence across reloads when it works.

const isWeb = Platform.OS === "web";
const memory = new Map<string, string>();

function lsGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // in-app browser blocked storage — memory cache still holds it
  }
}

function lsRemove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    memory.set(key, value);
    lsSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    const cached = memory.get(key);
    if (cached !== undefined) return cached;
    const stored = lsGet(key);
    if (stored !== null) memory.set(key, stored);
    return stored;
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    memory.delete(key);
    lsRemove(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
