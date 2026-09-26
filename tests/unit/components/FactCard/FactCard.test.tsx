import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMockHit } from '@tests/test-utils/fixtures';
import FactCard from '@/components/FactCard/FactCard';

/** The row that opens a note owns its heading, so the card is named from outside. */
function renderCard(hit: ReturnType<typeof createMockHit>) {
  return render(
    <>
      <span id="row-title">{hit.title}</span>
      <FactCard hit={hit} id="note-panel" labelledBy="row-title" />
    </>
  );
}

describe('FactCard', () => {
  it('renders the note body under the id and name the row gives it', () => {
    renderCard(createMockHit({ created_at: '2026-05-24T21:42:51Z' }));

    const panel = screen.getByRole('article');
    expect(panel).toHaveAttribute('id', 'note-panel');
    expect(panel).toHaveAccessibleName('Test Fact Title');
    expect(screen.getByText('This is the detailed fact content.')).toBeVisible();
    expect(screen.getByText('Project Alpha, Project Beta')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Open note|Close note/i })).not.toBeInTheDocument();
  });

  it('leaves the heading, ordinal, project and date to the row that names it', () => {
    // Restating them here put the same four facts on screen twice, one line apart.
    renderCard(createMockHit({ created_at: '2026-05-24T21:42:51Z' }));

    const panel = screen.getByRole('article');
    expect(panel.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(panel).not.toHaveTextContent('№');
    expect(panel).not.toHaveTextContent('May 2026');
    expect(panel).not.toHaveTextContent('Work Style');
  });

  it('shows fact instead of content when both fields exist', () => {
    renderCard(
      createMockHit({
        fact: 'The selected fact.',
        content: 'Longer source content that is not the selected fact.',
      })
    );

    expect(screen.getByText('The selected fact.')).toBeVisible();
    expect(screen.queryByText('Longer source content that is not the selected fact.')).toBeNull();
  });

  it('exposes topics and safe DEV evidence immediately, without a permalink', () => {
    renderCard(createMockHit({ url: 'https://dev.to/user/post', objectID: 'card:test:1' }));

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
      renderCard(createMockHit({ url }));

      expect(
        screen.queryByRole('link', { name: /View source|Read on DEV/i })
      ).not.toBeInTheDocument();
    }
  );

  it('renders honest fallbacks when optional note fields are absent', () => {
    renderCard(
      createMockHit({
        content: '',
        fact: '',
        blurb: '',
        category: '',
        projects: [],
        'tags.lvl0': [],
        'tags.lvl1': [],
        created_at: 'bad-date',
      })
    );

    expect(screen.getByText('No detail available.')).toBeVisible();
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Topics' })).not.toBeInTheDocument();
  });
});
