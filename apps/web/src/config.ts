export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

// Read index name from environment variable with fallback default
const baseIndexName = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME || 'system-notes';

export const ALGOLIA_INDEX = {
  CHAT_SOURCE: baseIndexName,
  SEARCH_RESULTS: baseIndexName,
} as const;
