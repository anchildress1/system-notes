import '../test-env';
// The /vitest entry, not the bare one. Both register the matchers at runtime,
// but only this one augments Vitest's `Assertion` interface — the bare entry
// augments Jest's, so every `toBeInTheDocument` was a type error that nothing
// reported, because tsconfig excluded the tests that would have surfaced it.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const storageEntries = new Map<string, string>();
const localStorageStub: Storage = {
  clear: () => storageEntries.clear(),
  getItem: (key) => storageEntries.get(key) ?? null,
  key: (index) => [...storageEntries.keys()][index] ?? null,
  get length() {
    return storageEntries.size;
  },
  removeItem: (key) => storageEntries.delete(key),
  setItem: (key, value) => storageEntries.set(key, value),
};

afterEach(() => {
  cleanup();
  localStorageStub.clear();
});

vi.stubGlobal('localStorage', localStorageStub);

class IntersectionObserverMock {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

import React from 'react';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    placeholder,
    blurDataURL,
    ...props
  }: Record<string, unknown>) => {
    return React.createElement('img', {
      src,
      alt,
      'data-placeholder': placeholder,
      'data-blur': blurDataURL,
      ...props,
    });
  },
}));
