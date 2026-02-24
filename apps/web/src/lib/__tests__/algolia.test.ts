import { describe, it, expect } from 'vitest';
import { isValidAppId, isValidApiKey, hasValidAlgoliaCredentials } from '../algolia';

describe('isValidAppId', () => {
  it('accepts valid 10-char alphanumeric app IDs', () => {
    expect(isValidAppId('ABCDEF1234')).toBe(true);
    expect(isValidAppId('abcdef1234')).toBe(true);
    expect(isValidAppId('AB12CD34EF')).toBe(true);
    expect(isValidAppId('0123456789')).toBe(true);
  });

  it('rejects app IDs with wrong length', () => {
    expect(isValidAppId('SHORT')).toBe(false);
    expect(isValidAppId('TOOLONGAPPID1')).toBe(false);
    expect(isValidAppId('')).toBe(false);
  });

  it('rejects app IDs with non-alphanumeric characters', () => {
    expect(isValidAppId('BAD!ID@@@@')).toBe(false);
    expect(isValidAppId('test_app_i')).toBe(false);
    expect(isValidAppId('ABC DEF123')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidAppId('abcdefghij')).toBe(true);
    expect(isValidAppId('ABCDEFGHIJ')).toBe(true);
    expect(isValidAppId('AbCdEfGhIj')).toBe(true);
  });
});

describe('isValidApiKey', () => {
  it('accepts keys with 20+ characters', () => {
    expect(isValidApiKey('12345678901234567890')).toBe(true);
    expect(isValidApiKey('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4')).toBe(true);
  });

  it('rejects keys shorter than 20 characters', () => {
    expect(isValidApiKey('tooshort')).toBe(false);
    expect(isValidApiKey('1234567890123456789')).toBe(false);
  });

  it('rejects empty key', () => {
    expect(isValidApiKey('')).toBe(false);
  });
});

describe('hasValidAlgoliaCredentials', () => {
  it('returns true when both app ID and key are valid', () => {
    expect(hasValidAlgoliaCredentials('ABCDEF1234', '12345678901234567890')).toBe(true);
  });

  it('returns false when app ID is invalid', () => {
    expect(hasValidAlgoliaCredentials('bad', '12345678901234567890')).toBe(false);
  });

  it('returns false when API key is invalid', () => {
    expect(hasValidAlgoliaCredentials('ABCDEF1234', 'short')).toBe(false);
  });

  it('returns false when both are invalid', () => {
    expect(hasValidAlgoliaCredentials('', '')).toBe(false);
  });
});
