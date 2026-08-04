import '../test-env';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
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

// Mock next/image to avoid DOM warnings for non-standard attributes.
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
    // Surfaced as data-* so LQIP wiring stays assertable without React warning
    // about non-standard attributes on a plain <img>.
    return React.createElement('img', {
      src,
      alt,
      'data-placeholder': placeholder,
      'data-blur': blurDataURL,
      ...props,
    });
  },
}));
