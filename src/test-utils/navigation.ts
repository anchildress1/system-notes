import { within } from '@testing-library/react';
import { expect } from 'vitest';

const SURFACE_LINKS = [
  { name: /Choices/i, href: '/' },
  { name: /Builds/i, href: '/projects' },
  { name: /Human/i, href: '/about' },
] as const;

export function expectSurfaceLinks(container: HTMLElement) {
  for (const { name, href } of SURFACE_LINKS) {
    expect(within(container).getByRole('link', { name }).getAttribute('href')).toBe(href);
  }
}
