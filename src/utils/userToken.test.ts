import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('userToken', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getChatSessionId returns a UUID-format string', async () => {
    const { getChatSessionId } = await import('./userToken');
    expect(getChatSessionId()).toMatch(UUID_PATTERN);
  });

  it('getChatSessionId is memoised — same value on every call within a session', async () => {
    const { getChatSessionId } = await import('./userToken');
    expect(getChatSessionId()).toBe(getChatSessionId());
  });

  it('returns an RFC 4122 UUID v4', async () => {
    const { getChatSessionId } = await import('./userToken');
    expect(getChatSessionId()).toMatch(UUID_V4_PATTERN);
  });

  it('throws when secure UUID generation is unavailable', async () => {
    vi.stubGlobal('crypto', {});

    const { getChatSessionId } = await import('./userToken');
    expect(() => getChatSessionId()).toThrow('Secure UUID generation is not available.');
  });
});
