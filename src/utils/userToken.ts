/**
 * Generate a unique user token for Algolia chat sessions.
 * Token is generated per-page-load (refresh updates it) and not persisted.
 */

// In-memory storage for the current page session
let chatSessionId: string | null = null;

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where randomUUID might be missing but crypto exists
  const buf = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    throw new Error('Secure random number generator is not available.');
  }

  // Per RFC 4122 (UUID v4) logic
  buf[6] = (buf[6] & 0x0f) | 0x40; // Version 4
  buf[8] = (buf[8] & 0x3f) | 0x80; // Variant 10xx

  const hex = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
};

export function getChatSessionId(): string {
  if (!chatSessionId) {
    chatSessionId = generateUUID();
  }
  return chatSessionId;
}
