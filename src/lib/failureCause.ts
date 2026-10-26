/**
 * Renders a caught value as one loggable phrase.
 *
 * @param error The caught value, of unknown type.
 * @returns `name: message`, the name alone when there is no message, or
 *   `ProviderError` for anything that is not an Error.
 */
export function failureCause(error: unknown): string {
  if (!(error instanceof Error)) return 'ProviderError';
  return error.message ? `${error.name}: ${error.message}` : error.name;
}
