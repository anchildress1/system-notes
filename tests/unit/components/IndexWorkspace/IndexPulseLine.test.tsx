import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IndexPulseLine from '@/components/IndexWorkspace/IndexPulseLine';

describe('IndexPulseLine', () => {
  afterEach(() => vi.useRealTimers());

  it('renders the corpus count and a client-relative update age', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-27T14:00:00Z'));

    render(<IndexPulseLine pulse={{ total: 12_345, latestCreatedAt: '2026-08-27T12:00:00Z' }} />);

    expect(screen.getByText('12,345 on file · updated 2h ago')).toBeVisible();
  });

  it('omits the age for an unusable timestamp without hiding the corpus fact', () => {
    render(<IndexPulseLine pulse={{ total: 0, latestCreatedAt: 'not a date' }} />);

    expect(screen.getByText('0 on file')).toBeVisible();
  });
});
