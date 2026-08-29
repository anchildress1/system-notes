let searchUserToken: string | null = null;

export function getSearchUserToken(): string | null {
  if (searchUserToken) return searchUserToken;
  if (!globalThis.crypto?.randomUUID) return null;
  searchUserToken = globalThis.crypto.randomUUID();
  return searchUserToken;
}
