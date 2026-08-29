import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getSearchUserToken', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('returns one stable UUID for the browser session', async () => {
    const randomUUID = vi.fn(() => 'b9ac8a0f-f5d4-4f7a-b3de-cf761d2d6f45');
    vi.stubGlobal('crypto', { randomUUID });
    const { getSearchUserToken } = await import('@/utils/userToken');

    const first = getSearchUserToken();

    expect(first).toBe('b9ac8a0f-f5d4-4f7a-b3de-cf761d2d6f45');
    expect(getSearchUserToken()).toBe(first);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('disables optional analytics when secure UUID generation is unavailable', async () => {
    vi.stubGlobal('crypto', {});
    const { getSearchUserToken } = await import('@/utils/userToken');

    expect(getSearchUserToken()).toBeNull();
  });
});
