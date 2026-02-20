/**
 * Shared Algolia configuration and credential validation.
 * Centralizes the duplicated credential checks from SearchPage, useFactIdRouting, and recommendations.
 */

export const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
export const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
export const ALGOLIA_AI_ID = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID || '';

/** Algolia app IDs are always 10 alphanumeric chars. */
const APP_ID_PATTERN = /^[A-Z0-9]{10}$/i;

/** Minimum length for a valid Algolia API key. */
const MIN_KEY_LENGTH = 20;

/** Returns true if the app ID matches the expected 10-char alphanumeric format. */
export function isValidAppId(appId: string): boolean {
  return APP_ID_PATTERN.test(appId);
}

/** Returns true if the API key meets the minimum length requirement. */
export function isValidApiKey(apiKey: string): boolean {
  return apiKey.length >= MIN_KEY_LENGTH;
}

/**
 * Returns true when both the Algolia app ID and search API key pass validation.
 * Use this to gate SDK initialization and prevent failed network requests
 * when credentials are obviously fake (e.g. test_app_id).
 */
export function hasValidAlgoliaCredentials(
  appId: string = ALGOLIA_APP_ID,
  apiKey: string = ALGOLIA_SEARCH_KEY
): boolean {
  return isValidAppId(appId) && isValidApiKey(apiKey);
}
