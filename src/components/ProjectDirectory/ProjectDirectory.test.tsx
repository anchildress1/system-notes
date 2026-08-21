import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockProject } from '@/test-utils/fixtures';
import ProjectDirectory, { exhibitLabel, exhibitStamp, HIGHLIGHT_COUNT } from './ProjectDirectory';

/** jsdom has no IntersectionObserver; without one the reveal path differs. */
function stubObserver() {
  class StubIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
}

const build = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    ...mockProject,
    id: `p${index}`,
    title: `Project ${index}`,
  }));

describe('exhibitLabel', () => {
  it('letters exhibits from the start of the alphabet', () => {
    expect(exhibitLabel(0)).toBe('A');
    expect(exhibitLabel(25)).toBe('Z');
  });

  it('falls back to a number once the alphabet runs out', () => {
    expect(exhibitLabel(26)).toBe('27');
  });
});

describe('exhibitStamp', () => {
  it('reads the head of a compound status', () => {
    expect(exhibitStamp('Active · Deployed')).toBe('in evidence');
    expect(exhibitStamp('Retired · 2026')).toBe('retired');
  });

  it('names a deliberate dead end as one', () => {
    // "scrapped" is the record saying the experiment answered its question.
    expect(exhibitStamp('Scrapped')).toBe('falsified on purpose');
    expect(exhibitStamp('Archived')).toBe('archived');
  });

  it('is case and space insensitive', () => {
    expect(exhibitStamp('  RETIRED  ·  x')).toBe('retired');
  });

  it('treats anything unrecognised as still in evidence', () => {
    expect(exhibitStamp('')).toBe('in evidence');
    expect(exhibitStamp(undefined)).toBe('in evidence');
    expect(exhibitStamp('Something New')).toBe('in evidence');
  });
});

describe('ProjectDirectory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows only the highlights until the archive is opened', () => {
    stubObserver();
    render(<ProjectDirectory projects={build(20)} />);

    expect(screen.getAllByRole('article')).toHaveLength(HIGHLIGHT_COUNT);
    expect(screen.getByText(/14 more in the archive/)).toBeInTheDocument();
  });

  it('opens the whole archive and closes it again', () => {
    stubObserver();
    render(<ProjectDirectory projects={build(20)} />);

    fireEvent.click(screen.getByRole('button', { name: /show all 20 exhibits/i }));
    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(screen.getByText(/Showing everything/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show only the highlights/i }));
    expect(screen.getAllByRole('article')).toHaveLength(HIGHLIGHT_COUNT);
  });

  it('offers no archive toggle when every exhibit already shows', () => {
    stubObserver();
    render(<ProjectDirectory projects={build(3)} />);

    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('states the exhibit, its stamp, and its stack', () => {
    stubObserver();
    render(<ProjectDirectory projects={[{ ...mockProject, award: 'Test Award' }]} />);
    const entry = screen.getByTestId('project-test-project');

    expect(within(entry).getByText('A')).toBeInTheDocument();
    expect(within(entry).getByText('in evidence')).toBeInTheDocument();
    expect(within(entry).getByRole('heading', { name: 'Test Project' })).toBeInTheDocument();
    expect(within(entry).getByText('Short description tagline.')).toBeInTheDocument();
    expect(within(entry).getByText('The core purpose of the project.')).toBeInTheDocument();
    expect(within(entry).getByText(/Test Award/)).toBeInTheDocument();
    expect(within(entry).getByRole('list', { name: /Test Project stack/i })).toBeInTheDocument();
  });

  it('keeps the argument closed until it is asked for', () => {
    stubObserver();
    render(<ProjectDirectory projects={[mockProject]} />);
    const entry = screen.getByTestId('project-test-project');
    const argue = within(entry).getByRole('button', { name: 'read the argument' });

    expect(argue).toHaveAttribute('aria-expanded', 'false');
    expect(within(entry).queryByRole('heading', { name: 'Outcome' })).not.toBeInTheDocument();

    fireEvent.click(argue);

    expect(within(entry).getByRole('button', { name: 'close the argument' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(within(entry).getByRole('heading', { name: "How it's built" })).toBeInTheDocument();
    expect(within(entry).getByRole('heading', { name: 'Outcome' })).toBeInTheDocument();
    expect(
      within(entry).getByRole('link', { name: /cards filed under this exhibit/i })
    ).toHaveAttribute('href', '/?project=Test+Project#notes-index');
  });

  it('points the toggle at the panel it controls', () => {
    stubObserver();
    render(<ProjectDirectory projects={[mockProject]} />);
    const entry = screen.getByTestId('project-test-project');
    const argue = within(entry).getByRole('button', { name: /the argument/i });

    fireEvent.click(argue);

    // A dangling aria-controls is worse than none; the panel must exist.
    const controlled = argue.getAttribute('aria-controls');
    expect(controlled).toBeTruthy();
    expect(document.getElementById(controlled!)).toBeInTheDocument();
  });

  it('files write-ups inside the argument, not the exhibit link row', () => {
    stubObserver();
    render(
      <ProjectDirectory
        projects={[
          {
            ...mockProject,
            app_url: 'https://example.com',
            blog_posts: [{ title: 'Build post', url: 'https://dev.to/test/post' }],
          },
        ]}
      />
    );
    const entry = screen.getByTestId('project-test-project');

    expect(within(entry).queryByRole('link', { name: /Build post/i })).not.toBeInTheDocument();
    fireEvent.click(within(entry).getByRole('button', { name: /the argument/i }));

    expect(within(entry).getByRole('link', { name: /Build post/i })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(within(entry).getByRole('link', { name: /launch/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('alternates which side the exhibit sits on', () => {
    stubObserver();
    render(<ProjectDirectory projects={build(3)} />);
    const articles = screen.getAllByRole('article');

    expect(articles[0]).not.toHaveAttribute('data-flip');
    expect(articles[1]).toHaveAttribute('data-flip');
    expect(articles[2]).not.toHaveAttribute('data-flip');
  });

  it('omits every optional part a project does not have', () => {
    stubObserver();
    render(
      <ProjectDirectory
        projects={[
          {
            ...mockProject,
            image_url: undefined,
            purpose: '',
            long_description: '',
            outcome: '',
            tech: [],
            repo_url: undefined,
            app_url: undefined,
            blog_posts: [],
            award: undefined,
            status: '',
          },
        ]}
      />
    );
    const entry = screen.getByTestId('project-test-project');

    expect(within(entry).queryByRole('img')).not.toBeInTheDocument();
    expect(within(entry).queryByRole('list', { name: /stack/i })).not.toBeInTheDocument();
    expect(within(entry).queryByRole('link', { name: /^launch/i })).not.toBeInTheDocument();
    // A blank status still gets a stamp and says what it does not know.
    expect(within(entry).getByText('in evidence')).toBeInTheDocument();
    expect(within(entry).getByText('status unavailable')).toBeInTheDocument();
  });

  it('reveals every exhibit outright when there is no observer to wait for', () => {
    // Reduced motion and unsupported browsers must not leave the page blank.
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<ProjectDirectory projects={build(2)} />);

    for (const article of screen.getAllByRole('article')) {
      expect(article).toHaveAttribute('data-revealed', 'true');
    }
  });

  it('renders nothing for an empty registry', () => {
    stubObserver();
    render(<ProjectDirectory projects={[]} />);

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
  });
});
