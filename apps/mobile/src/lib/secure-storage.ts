import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation — its methods throw in a
// browser. The Expo web export (meloman-mobile.vercel.app) still needs
// to persist the JWT and the device id, so on web we fall back to
// localStorage. Native builds keep the keychain/keystore-backed path
// unchanged. Optional chaining guards the Node render pass of the
// static export, where `localStorage` does not exist (returns null,
// which callers already handle as "nothing stored yet").

const isWeb = Platform.OS === "web";

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
