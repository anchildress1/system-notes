import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// UUID v4: version nibble = '4', variant nibble ∈ {8,9,a,b}
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('userToken', () => {
  // Reset module between tests so the in-memory singletons start fresh each time.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getSearchSessionId returns a UUID-format string', async () => {
    const { getSearchSessionId } = await import('./userToken');
    expect(getSearchSessionId()).toMatch(UUID_PATTERN);
  });

  it('getSearchSessionId is memoised — same value on every call within a session', async () => {
    const { getSearchSessionId } = await import('./userToken');
    expect(getSearchSessionId()).toBe(getSearchSessionId());
  });

  it('getChatSessionId is memoised — same value on every call within a session', async () => {
    const { getChatSessionId } = await import('./userToken');
    expect(getChatSessionId()).toBe(getChatSessionId());
  });

  it('getSearchSessionId and getChatSessionId produce distinct tokens', async () => {
    const { getSearchSessionId, getChatSessionId } = await import('./userToken');
    expect(getSearchSessionId()).not.toBe(getChatSessionId());
  });

  it('getOrCreateUserToken (deprecated) returns the same token as getSearchSessionId', async () => {
    const { getSearchSessionId, getOrCreateUserToken } = await import('./userToken');
    expect(getOrCreateUserToken()).toBe(getSearchSessionId());
  });

  it('falls back to crypto.getRandomValues and produces a valid UUID v4 when randomUUID is absent', async () => {
    const mockGetRandomValues = vi.fn((buf: Uint8Array) => {
      for (let i = 0; i < buf.length; i++) buf[i] = i + 1;
      return buf;
    });
    vi.stubGlobal('crypto', { getRandomValues: mockGetRandomValues });

    const { getSearchSessionId } = await import('./userToken');
    const id = getSearchSessionId();

    expect(mockGetRandomValues).toHaveBeenCalled();
    expect(id).toMatch(UUID_V4_PATTERN);
  });

  it('throws when neither crypto.randomUUID nor crypto.getRandomValues is available', async () => {
    vi.stubGlobal('crypto', {});

    const { getSearchSessionId } = await import('./userToken');
    expect(() => getSearchSessionId()).toThrow('Secure random number generator is not available.');
  });
});
