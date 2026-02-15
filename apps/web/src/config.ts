export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Read index names from environment variables with fallback defaults
const baseIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'system-notes';
const suggestionsIndexName =
  process.env.NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME || `${baseIndexName}_query_suggestions`;

export const ALGOLIA_INDEX = {
  CHAT_SOURCE: baseIndexName,
  SEARCH_RESULTS: baseIndexName,
  QUERY_SUGGESTIONS: suggestionsIndexName,
} as const;
