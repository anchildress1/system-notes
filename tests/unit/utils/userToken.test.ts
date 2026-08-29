import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('getSearchUserToken', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('returns one stable UUID for the browser session', async () => {
    const { getSearchUserToken } = await import('@/utils/userToken');

    const first = getSearchUserToken();

    expect(first).toMatch(UUID_PATTERN);
    expect(getSearchUserToken()).toBe(first);
  });

  it('disables optional analytics when secure UUID generation is unavailable', async () => {
    vi.stubGlobal('crypto', {});
    const { getSearchUserToken } = await import('@/utils/userToken');

    expect(getSearchUserToken()).toBeNull();
  });
});
