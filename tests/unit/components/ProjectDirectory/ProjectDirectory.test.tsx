import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProjectDirectory, {
  EXHIBIT_DECK,
  EXHIBITS,
} from '@/components/ProjectDirectory/ProjectDirectory';
import rawProjects from '@/data/projects.json';
import { mockProject } from '@tests/test-utils/fixtures';

const selected = [
  ['save-the-sun', 'Save the Sun'],
  ['vestige', 'Vestige'],
  ['metal-birds-feed', 'Metal Birds Feed'],
  ['supascribe-notes', 'SupaScribe Notes'],
  ['rai-lint', 'RAI Lint'],
  ['unearthed', 'Unearthed'],
  ['carbon-trace', 'Carbon Trace'],
] as const;

const projects = [
  ...selected.map(([id, title], index) => ({
    ...mockProject,
    id,
    title,
    award: index === 0 ? 'A real award' : undefined,
    app_url: index === 0 ? 'https://example.com/app' : undefined,
    repo_url: index === 0 ? 'https://github.com/example/project' : undefined,
    blog_posts:
      index === 0 ? [{ title: 'Build notes', url: 'https://dev.to/example/build-notes' }] : [],
    announcements: index === 0 ? [{ title: 'Award', url: 'https://dev.to/devteam/award' }] : [],
    tech: [
      { name: 'TypeScript', role: 'Language' },
      { name: 'Cloud Run', role: 'Deploy' },
      { name: 'Vitest', role: 'Test' },
      { name: 'Playwright', role: 'E2E' },
    ],
  })),
  { ...mockProject, id: 'unselected', title: 'Unselected System' },
];

describe('EXHIBITS', () => {
  // The catalogue is keyed by id against projects.json. An id that matches nothing
  // drops its exhibit silently, so this is the check that keeps the two in step.
  it('names a project that exists', () => {
    const known = new Set((rawProjects as { objectID: string }[]).map((p) => p.objectID));

    expect(EXHIBITS.filter((exhibit) => !known.has(exhibit.id))).toEqual([]);
  });

  it('is counted correctly by the deck', () => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

    expect(EXHIBIT_DECK.toLowerCase()).toContain(`${words[EXHIBITS.length]} exhibits`);
  });
});

describe('ProjectDirectory', () => {
  it('renders only the curated exhibits in their editorial order', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(screen.getAllByRole('article')).toHaveLength(selected.length);
    expect(screen.getByTestId('exhibit-save-the-sun')).toHaveAttribute('id', 'save-the-sun');
    expect(screen.queryByText('Unselected System')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(selected.map(([, title]) => title));
  });

  it('renders the standard, evidence, and the first three materials', () => {
    render(<ProjectDirectory projects={projects} />);
    const exhibit = screen.getByTestId('exhibit-save-the-sun');

    expect(
      within(exhibit).getByText('The model can speak. It does not get the answer.')
    ).toBeVisible();
    expect(
      within(exhibit).getByText(/deterministic game engine keeps the rune secret/i)
    ).toBeVisible();
    expect(within(exhibit).getByText('TypeScript · Cloud Run · Vitest')).toBeVisible();
  });

  it('opens every outbound reference in a new tab with the opener severed', () => {
    render(<ProjectDirectory projects={projects} />);
    const exhibit = screen.getByTestId('exhibit-save-the-sun');

    const outbound = ['Live site', 'Repository', 'Writing', 'Receipt'];
    for (const label of outbound) {
      const link = within(exhibit).getByRole('link', { name: new RegExp(label) });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }

    expect(within(exhibit).getByRole('link', { name: /Filed notes/ })).toHaveAttribute(
      'href',
      '/notes?project=Save+the+Sun#notes-index'
    );
  });

  it('omits a reference the project does not carry rather than rendering a dead one', () => {
    render(<ProjectDirectory projects={projects} />);
    const exhibit = screen.getByTestId('exhibit-vestige');

    for (const label of ['Live site', 'Repository', 'Writing', 'Receipt']) {
      expect(
        within(exhibit).queryByRole('link', { name: new RegExp(label) })
      ).not.toBeInTheDocument();
    }
    expect(within(exhibit).getByRole('link', { name: /Filed notes/ })).toBeVisible();
    expect(within(exhibit).queryByRole('link', { name: '' })).not.toBeInTheDocument();
  });

  it('does not render selection controls or a hidden reader', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(screen.getByRole('region', { name: 'Selected exhibits' })).toBeVisible();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
