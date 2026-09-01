import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProjectDirectory from '@/components/ProjectDirectory/ProjectDirectory';
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
    ],
  })),
  { ...mockProject, id: 'unselected', title: 'Unselected System' },
];

describe('ProjectDirectory', () => {
  it('renders only the seven curated exhibits in their editorial order', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(screen.getAllByRole('article')).toHaveLength(selected.length);
    expect(screen.getByTestId('exhibit-save-the-sun')).toHaveAttribute('id', 'save-the-sun');
    expect(screen.queryByText('Unselected System')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(selected.map(([, title]) => title));
  });

  it('renders the standard, evidence, and only the references a project carries', () => {
    render(<ProjectDirectory projects={projects} />);
    const exhibit = screen.getByTestId('exhibit-save-the-sun');

    expect(
      within(exhibit).getByText('The model can speak. It does not get the answer.')
    ).toBeVisible();
    expect(
      within(exhibit).getByText(/deterministic game engine keeps the rune secret/i)
    ).toBeVisible();
    expect(within(exhibit).getByText('TypeScript · Cloud Run · Vitest')).toBeVisible();
    expect(within(exhibit).getByRole('link', { name: /Live work/ })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(within(exhibit).getByRole('link', { name: /Filed notes/ })).toHaveAttribute(
      'href',
      '/notes?project=Save+the+Sun#notes-index'
    );
  });

  it('does not render selection controls or a hidden reader', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(screen.getByRole('region', { name: 'Selected exhibits' })).toBeVisible();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders nothing when the registry has no curated projects', () => {
    const { container } = render(<ProjectDirectory projects={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
