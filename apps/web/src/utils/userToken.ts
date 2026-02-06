/**
 * Generate or retrieve a unique user token for Algolia session tracking.
 * Uses sessionStorage for per-session tokens to prevent cross-talk between users.
 *
 * @returns A unique token for this session
 */
export function getOrCreateUserToken(): string {
  const STORAGE_KEY = 'algolia_user_token';

  // Check if we have a token in sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const existingToken = sessionStorage.getItem(STORAGE_KEY);
    if (existingToken) {
      return existingToken;
    }

    // Generate a new token: timestamp + random string
    const token = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(STORAGE_KEY, token);
    return token;
  }

  // Fallback for SSR or when sessionStorage is unavailable
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
