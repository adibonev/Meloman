import { deleteItem, getItem, setItem } from "./secure-storage";

// JWT from /api/auth/mobile-login. On native it lives in the device
// keychain/keystore; on the web export it falls back to localStorage
// (see ./secure-storage). Never AsyncStorage — it's a credential.
const TOKEN_KEY = "meloman.token";

export async function saveToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
}
