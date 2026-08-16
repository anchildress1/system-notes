export const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
export const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
export const ALGOLIA_AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || '';

const APP_ID_PATTERN = /^[A-Z0-9]{10}$/i;

const MIN_KEY_LENGTH = 20;

export function isValidAppId(appId: string): boolean {
  return APP_ID_PATTERN.test(appId);
}

export function isValidApiKey(apiKey: string): boolean {
  return apiKey.length >= MIN_KEY_LENGTH;
}

export function hasValidAlgoliaCredentials(
  appId: string = ALGOLIA_APP_ID,
  apiKey: string = ALGOLIA_SEARCH_KEY
): boolean {
  return isValidAppId(appId) && isValidApiKey(apiKey);
}
