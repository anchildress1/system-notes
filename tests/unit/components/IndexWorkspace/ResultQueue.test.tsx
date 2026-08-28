import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResultQueue from '@/components/IndexWorkspace/ResultQueue';
import { createMockHit } from '@tests/test-utils/fixtures';

vi.mock('@/components/FactCard/FactCard', () => ({
  default: ({ hit }: { hit: { title: string } }) => <article>{hit.title}</article>,
}));

function resultSet(label: string) {
  return Array.from({ length: 7 }, (_, index) =>
    createMockHit({
      objectID: index === 0 ? 'card:shared:first' : `card:${label}:${index + 1}`,
      title: `${label} note ${index + 1}`,
      __position: index + 1,
    })
  );
}

describe('ResultQueue', () => {
  it('returns to page one when equal-sized results keep the same lead hit', () => {
    const { rerender } = render(
      <ResultQueue items={resultSet('Old')} selectedId="card:shared:first" onSelect={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    expect(screen.getByText('Old note 7')).toBeVisible();

    rerender(
      <ResultQueue items={resultSet('Old')} selectedId="card:shared:first" onSelect={vi.fn()} />
    );
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    expect(screen.getByText('Old note 7')).toBeVisible();

    rerender(
      <ResultQueue items={resultSet('New')} selectedId="card:shared:first" onSelect={vi.fn()} />
    );

    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(screen.getByText('New note 2')).toBeVisible();
    expect(screen.queryByText('New note 7')).not.toBeInTheDocument();
  });
});
