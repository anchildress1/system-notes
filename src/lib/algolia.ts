export const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
export const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

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

/**
 * Agent Studio agent that answers the intake.
 *
 * Its own id rather than the general one: this agent answers in the first person
 * as Ashley and carries the project roster in its prompt, which is not the voice
 * or the context any other agent on the account should inherit.
 */
export const ALGOLIA_INTAKE_AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_INTAKE_AGENT_ID || '';

/**
 * Whether the intake has an agent to send a question to.
 *
 * The agent is reached at the application's own Algolia host with the same
 * search credentials, so it needs those to be valid as well as an agent id.
 *
 * @param agentId Agent identifier; defaults to the configured one.
 * @returns True when a question can be sent.
 */
export function hasValidAgentCredentials(agentId: string = ALGOLIA_INTAKE_AGENT_ID): boolean {
  return hasValidAlgoliaCredentials() && agentId.trim().length > 0;
}
