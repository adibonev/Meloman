import * as SecureStore from "expo-secure-store";

// JWT from /api/auth/mobile-login lives in the device keychain/keystore
// (expo-secure-store), never AsyncStorage — it's a credential.
const TOKEN_KEY = "meloman.token";

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
