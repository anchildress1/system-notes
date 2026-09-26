import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ResultQueue from '@/components/IndexWorkspace/ResultQueue';
import { createMockHit } from '@tests/test-utils/fixtures';

vi.mock('@/components/FactCard/FactCard', () => ({
  default: ({ hit, id, labelledBy }: { hit: { fact: string }; id: string; labelledBy: string }) => (
    <article id={id} aria-labelledby={labelledBy}>
      {hit.fact}
    </article>
  ),
}));

function resultSet(label: string, length = 7) {
  return Array.from({ length }, (_, index) =>
    createMockHit({
      objectID: index === 0 ? 'card:shared:first' : `card:${label}:${index + 1}`,
      title: `${label} note ${index + 1}`,
      fact: `${label} evidence ${index + 1}`,
      __position: index + 1,
    })
  );
}

const rows = () => [...document.querySelectorAll<HTMLButtonElement>('[data-ranked-queue] button')];
const rowTitles = () => rows().map((row) => row.children.item(1)?.textContent);
const openRows = () => rows().filter((row) => row.getAttribute('aria-expanded') === 'true');

/** The workspace owns the selection, so paging only moves when it is fed back. */
function Workspace({
  items,
  initialId,
  onSelect = vi.fn(),
}: {
  items: ReturnType<typeof resultSet>;
  initialId?: string;
  onSelect?: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(initialId);
  return (
    <ResultQueue
      items={items}
      selectedId={selectedId}
      onSelect={(id) => {
        onSelect(id);
        setSelectedId(id);
      }}
      onReveal={setSelectedId}
    />
  );
}

describe('ResultQueue', () => {
  it('opens the selected note inside its own row, leaving the order alone', () => {
    const onSelect = vi.fn();
    render(
      <ResultQueue
        items={resultSet('Old')}
        selectedId="card:shared:first"
        onSelect={onSelect}
        onReveal={vi.fn()}
      />
    );

    const [first, second] = rows();
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-controls', 'note-card:shared:first');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    // A collapsed row controls nothing, because the panel it would name is not
    // in the document.
    expect(second).not.toHaveAttribute('aria-controls');

    fireEvent.click(second!);

    expect(onSelect).toHaveBeenCalledWith('card:Old:2');
    // The row order is the ranking. Selecting must not reorder it.
    expect(rowTitles()).toEqual([1, 2, 3, 4, 5, 6].map((rank) => `Old note ${rank}`));
  });

  it('renders the open note as the only panel, named by its own row', () => {
    render(
      <ResultQueue
        items={resultSet('Old')}
        selectedId="card:Old:3"
        onSelect={vi.fn()}
        onReveal={vi.fn()}
      />
    );

    const panels = screen.getAllByRole('article');
    expect(panels).toHaveLength(1);
    expect(panels[0]).toHaveTextContent('Old evidence 3');
    expect(panels[0]).toHaveAccessibleName('Old note 3');
    expect(rows()[2]).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the row in place rather than moving focus to a reader above it', () => {
    render(
      <ResultQueue
        items={resultSet('Old')}
        selectedId="card:shared:first"
        onSelect={vi.fn()}
        onReveal={vi.fn()}
      />
    );

    const second = rows()[1]!;
    second.focus();
    fireEvent.click(second);

    expect(second).toHaveFocus();
  });

  it('pages to whichever page the new selection lives on', () => {
    // The rail's board selects by rank, so the note it picks can sit pages down.
    // A page with nothing open on it is the failure this prevents.
    const items = resultSet('Old', 20);
    const { rerender } = render(
      <ResultQueue
        items={items}
        selectedId="card:shared:first"
        onSelect={vi.fn()}
        onReveal={vi.fn()}
      />
    );
    expect(screen.getByText('Page 1 of 4')).toBeVisible();

    rerender(
      <ResultQueue items={items} selectedId="card:Old:15" onSelect={vi.fn()} onReveal={vi.fn()} />
    );

    expect(screen.getByText('Page 3 of 4')).toBeVisible();
    expect(screen.getByRole('article')).toHaveTextContent('Old evidence 15');
    expect(rows()[2]).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the top-ranked note when the selection is not in the results', () => {
    render(
      <ResultQueue
        items={resultSet('Old')}
        selectedId="card:gone:99"
        onSelect={vi.fn()}
        onReveal={vi.fn()}
      />
    );

    expect(rows()[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('article')).toHaveTextContent('Old evidence 1');
  });

  it('opens the top-ranked note when no selection is supplied at all', () => {
    render(<ResultQueue items={resultSet('Old')} onSelect={vi.fn()} onReveal={vi.fn()} />);

    expect(rows()[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
  });

  it('renders nothing rather than an empty list when there are no results', () => {
    const { container } = render(<ResultQueue items={[]} onSelect={vi.fn()} onReveal={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([1, 6])('omits the pager when %i notes fit on one page', (count) => {
    render(<ResultQueue items={resultSet('Old', count)} onSelect={vi.fn()} onReveal={vi.fn()} />);

    expect(rows()).toHaveLength(count);
    expect(
      screen.queryByRole('navigation', { name: 'Ranked notes pages' })
    ).not.toBeInTheDocument();
  });

  it('opens the first note of the page it pages onto', () => {
    // Every page has exactly one open row. Storing a chosen page alongside the
    // selection is what let Next land on six rows with nothing open on any of
    // them, which is the one state the reading surface must never reach.
    render(<Workspace items={resultSet('Old', 20)} initialId="card:shared:first" />);

    for (const [page, lead] of [
      [2, 'Old note 7'],
      [3, 'Old note 13'],
      [4, 'Old note 19'],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText(`Page ${page} of 4`)).toBeVisible();
      expect(openRows()).toHaveLength(1);
      expect(openRows()[0]?.children.item(1)?.textContent).toBe(lead);
      expect(rowTitles()[0]).toBe(lead);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Page 3 of 4')).toBeVisible();
    expect(openRows()[0]?.children.item(1)?.textContent).toBe('Old note 13');
  });

  it('never leaves a page without an open row, however it is reached', () => {
    render(<Workspace items={resultSet('Old', 20)} initialId="card:Old:15" />);

    expect(openRows()).toHaveLength(1);
    for (const name of ['Previous', 'Previous', 'Next', 'Next', 'Next']) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(openRows()).toHaveLength(1);
      expect(screen.getAllByRole('article')).toHaveLength(1);
    }
  });

  it('pages without reporting a result click', () => {
    // Pressing Next is navigation. An insights click fired from it would record
    // a selection the reader never made.
    const onSelect = vi.fn();
    render(
      <Workspace items={resultSet('Old', 20)} initialId="card:shared:first" onSelect={onSelect} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(rows()[1]!);
    expect(onSelect).toHaveBeenCalledWith('card:Old:8');
  });

  it('moves focus to the opposite pager control when the pressed one retires', () => {
    render(<Workspace items={resultSet('Old')} initialId="card:shared:first" />);

    const next = screen.getByRole('button', { name: 'Next' });
    const previous = screen.getByRole('button', { name: 'Previous' });

    next.focus();
    fireEvent.click(next);
    expect(next).toBeDisabled();
    expect(previous).toHaveFocus();

    fireEvent.click(previous);
    expect(previous).toBeDisabled();
    expect(next).toHaveFocus();
  });

  it('falls back to the row ordinal when a hit carries no remote position', () => {
    const items = resultSet('Old', 3).map((hit) => ({ ...hit, __position: 0 }));
    render(<ResultQueue items={items} onSelect={vi.fn()} onReveal={vi.fn()} />);

    expect(rows().map((row) => row.children.item(0)?.textContent)).toEqual([
      expect.stringContaining('№ 1'),
      expect.stringContaining('№ 2'),
      expect.stringContaining('№ 3'),
    ]);
  });

  it('names an unlabelled note and project honestly rather than leaving a gap', () => {
    render(
      <ResultQueue
        items={[createMockHit({ category: '', projects: [], created_at: 'bad-date' })]}
        onSelect={vi.fn()}
      />
    );

    const meta = rows()[0]!.children.item(0)!;
    expect(meta).toHaveTextContent('№ 1 · System Notes');
    expect(meta).toHaveTextContent('Note');
    // An unparseable date is dropped, not printed as "Invalid Date".
    expect(meta).not.toHaveTextContent('Invalid');
  });
});
