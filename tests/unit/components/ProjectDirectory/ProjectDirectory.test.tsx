import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProjectDirectory from '@/components/ProjectDirectory/ProjectDirectory';
import { mockProject } from '@tests/test-utils/fixtures';

const projects = [
  {
    ...mockProject,
    id: 'first-system',
    title: 'First System',
    status: 'Active · Deployed',
    purpose: 'Proves the first thing.',
    long_description: 'The long account of the first system.',
    outcome: 'It shipped and stayed shipped.',
    tech: [{ name: 'TypeScript', role: 'Language' }],
    app_url: 'https://example.com/app',
    repo_url: 'https://github.com/example/first',
  },
  {
    ...mockProject,
    id: 'second-system',
    title: 'Second System',
    status: 'Scrapped',
    purpose: 'Proves the second thing.',
    long_description: 'The long account of the second system.',
    outcome: 'A cleanly falsified hypothesis.',
    tech: [{ name: 'Python', role: 'Rules' }],
    award: 'Some Award 2026',
    app_url: undefined,
    image_url: undefined,
  },
];

const rail = () => screen.getByRole('navigation', { name: 'Systems' });
const detail = () => screen.getByRole('article');

describe('ProjectDirectory', () => {
  it('lists every system in the rail, not just a highlighted few', () => {
    // The archive used to be behind a control. A rail that already scrolls has
    // no reason to hide half its own contents.
    render(<ProjectDirectory projects={projects} />);

    expect(within(rail()).getAllByRole('button')).toHaveLength(projects.length);
    expect(within(rail()).getByText('First System')).toBeVisible();
    expect(within(rail()).getByText('Second System')).toBeVisible();
  });

  it('opens on the first system', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('First System');
    expect(screen.getByTestId('project-first-system')).toHaveAttribute('aria-current', 'true');
  });

  it('swaps the detail pane when another system is chosen', () => {
    render(<ProjectDirectory projects={projects} />);

    fireEvent.click(screen.getByTestId('project-second-system'));

    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('Second System');
    expect(within(detail()).getByText('A cleanly falsified hypothesis.')).toBeVisible();
    expect(screen.getByTestId('project-second-system')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('project-first-system')).not.toHaveAttribute('aria-current');
  });

  it('shows the stack as a description list rather than a run of chips', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(within(detail()).getByText('TypeScript')).toBeVisible();
    expect(within(detail()).getByText('Language')).toBeVisible();
  });

  it('marks an awarded system in the rail and names the award in the detail', () => {
    render(<ProjectDirectory projects={projects} />);
    fireEvent.click(screen.getByTestId('project-second-system'));

    expect(within(detail()).getByText(/Some Award 2026/)).toBeVisible();
  });

  it('cross-links into the index filtered by the open system', () => {
    render(<ProjectDirectory projects={projects} />);

    expect(
      within(detail()).getByRole('link', { name: /Decisions from First System/ })
    ).toHaveAttribute('href', '/notes?project=First+System#notes-index');
  });

  it('identifies every outbound link as opening a new tab', () => {
    render(<ProjectDirectory projects={projects} />);

    for (const name of [/Live app/, /Repo/]) {
      const link = within(detail()).getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('omits a link the project does not carry rather than rendering a dead one', () => {
    render(<ProjectDirectory projects={projects} />);
    fireEvent.click(screen.getByTestId('project-second-system'));

    expect(within(detail()).queryByRole('link', { name: /Live app/ })).not.toBeInTheDocument();
  });

  it('renders nothing at all when there are no projects', () => {
    const { container } = render(<ProjectDirectory projects={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
