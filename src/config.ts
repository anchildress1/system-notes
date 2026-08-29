export const ALGOLIA_INDEX_NAME =
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME || 'system-notes';

/** The blog lives off site. Named here rather than in `profile`, so the header
 *  can reach it without pulling the profile's prose into the client bundle. */
export const BLOG_URL = 'https://dev.to/anchildress1';
