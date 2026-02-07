/**
 * Generate unique user tokens for Algolia sessions.
 * Returns distinct tokens for Search vs Chat to prevent context pollution.
 * Tokens are generated per-page-load (refresh updates them) and not persisted.
 */

// In-memory storage for the current page session
let searchSessionId: string | null = null;
let chatSessionId: string | null = null;

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export function getSearchSessionId(): string {
  if (!searchSessionId) {
    searchSessionId = generateUUID();
  }
  return searchSessionId;
}

export function getChatSessionId(): string {
  if (!chatSessionId) {
    chatSessionId = generateUUID();
  }
  return chatSessionId;
}

/**
 * @deprecated Use getSearchSessionId or getChatSessionId instead
 */
export function getOrCreateUserToken(): string {
  return getSearchSessionId();
}
