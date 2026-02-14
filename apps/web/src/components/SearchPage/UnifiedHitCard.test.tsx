import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnifiedHitCard from './UnifiedHitCard';
import type { Hit } from 'instantsearch.js';
import type { FactHitRecord } from '../FactCard/FactCard';
import { createMockHit } from '@/test-utils/fixtures';

// Mock FactCard to verify it always renders
vi.mock('../FactCard/FactCard', () => ({
  default: ({ hit }: { hit: Hit<FactHitRecord> }) => (
    <div data-testid="fact-card">Card: {hit.title}</div>
  ),
}));

describe('UnifiedHitCard', () => {
  it('renders FactCard for hits with a url', () => {
    const hit = createMockHit({ url: 'https://example.com' });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('fact-card')).toBeInTheDocument();
    expect(screen.getByText('Card: Test Fact Title')).toBeInTheDocument();
  });

  it('renders FactCard for hits without a url', () => {
    const hit = createMockHit({ url: undefined });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('fact-card')).toBeInTheDocument();
  });

  it('renders FactCard for all hit types', () => {
    const hit = createMockHit({
      url: '',
      blurb: 'Just some text description',
    });
    render(<UnifiedHitCard hit={hit} />);

    expect(screen.getByTestId('fact-card')).toBeInTheDocument();
  });
});
