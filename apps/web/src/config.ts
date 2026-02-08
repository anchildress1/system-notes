export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ALGOLIA_INDEX = {
  CHAT_SOURCE: 'system-notes',
  SEARCH_RESULTS: 'merged-search',
  QUERY_SUGGESTIONS: 'merged-search_query_suggestions',
} as const;
