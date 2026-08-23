import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMockHit } from '@tests/test-utils/fixtures';
import FactCard from '@/components/FactCard/FactCard';

describe('FactCard', () => {
  it('renders the complete selected note without an open or flip control', () => {
    render(<FactCard hit={createMockHit({ created_at: '2026-05-24T21:42:51Z' })} position={6} />);

    expect(screen.getByRole('heading', { name: 'Test Fact Title' })).toBeInTheDocument();
    expect(screen.getByText(/№ 06 · Project Alpha · May 2026/)).toBeInTheDocument();
    expect(screen.getByText('Work Style')).toBeInTheDocument();
    expect(screen.getByText('This is the detailed fact content.')).toBeVisible();
    expect(screen.getByText('Project Alpha, Project Beta')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Open note|Close note/i })).not.toBeInTheDocument();
  });

  it('shows fact instead of content when both fields exist', () => {
    render(
      <FactCard
        hit={createMockHit({
          fact: 'The selected fact.',
          content: 'Longer source content that is not the selected fact.',
        })}
      />
    );

    expect(screen.getByText('The selected fact.')).toBeVisible();
    expect(screen.queryByText('Longer source content that is not the selected fact.')).toBeNull();
  });

  it('exposes topics and safe DEV evidence immediately, without a permalink', () => {
    render(
      <FactCard hit={createMockHit({ url: 'https://dev.to/user/post', objectID: 'card:test:1' })} />
    );

    // Selection is what identifies a note, and that already reaches Algolia as a
    // click event — the card does not need to carry a URL of its own.
    expect(screen.queryByRole('link', { name: /Permalink/i })).toBeNull();
    expect(screen.getByRole('link', { name: /Read on DEV/i })).toHaveAttribute(
      'href',
      'https://dev.to/user/post'
    );
    expect(screen.getByRole('list', { name: 'Topics' })).toBeVisible();
  });

  it.each(['javascript:alert(1)', 'data:text/html,bad', undefined])(
    'does not expose unsafe or missing evidence URL %j',
    (url) => {
      render(<FactCard hit={createMockHit({ url })} />);

      expect(
        screen.queryByRole('link', { name: /View source|Read on DEV/i })
      ).not.toBeInTheDocument();
    }
  );

  it('renders honest fallbacks when optional note fields are absent', () => {
    render(
      <FactCard
        hit={createMockHit({
          content: '',
          fact: '',
          blurb: '',
          category: '',
          projects: [],
          'tags.lvl0': [],
          'tags.lvl1': [],
          created_at: 'bad-date',
        })}
      />
    );

    expect(screen.getByText('No detail available.')).toBeVisible();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText(/№ 01 · System Notes/)).toBeInTheDocument();
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Topics' })).not.toBeInTheDocument();
  });
});
