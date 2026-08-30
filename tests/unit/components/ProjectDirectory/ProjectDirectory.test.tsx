import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    blog_posts: [{ title: 'Build notes', url: 'https://dev.to/example/build-notes' }],
    announcements: [{ title: 'Award evidence', url: 'https://dev.to/devteam/award' }],
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
const scrollTo = vi.fn();

function bounds(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({}),
  };
}

describe('ProjectDirectory', () => {
  beforeEach(() => {
    globalThis.history.replaceState(null, '', '/projects');
    scrollTo.mockReset();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
  });

  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollTo;
  });

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

  it('reads a fresh deep link after a client-side remount', () => {
    globalThis.history.replaceState(null, '', '/projects?system=second-system');
    const view = render(<ProjectDirectory projects={projects} />);
    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('Second System');

    view.unmount();
    globalThis.history.replaceState(null, '', '/projects');
    render(<ProjectDirectory projects={projects} />);

    expect(within(detail()).getByRole('heading', { level: 2 })).toHaveTextContent('First System');
  });

  it('stays silent on a deep link and speaks only once a system is chosen', () => {
    // getServerSnapshot reports no linked system, so the hydration render shows
    // the first project and the client snapshot swaps it. Announcing `selected`
    // made that swap speak a project title over the page-load announcement.
    globalThis.history.replaceState(null, '', '/projects?system=second-system');
    render(<ProjectDirectory projects={projects} />);

    expect(screen.getByRole('status')).toHaveTextContent('');

    fireEvent.click(screen.getByTestId('project-first-system'));

    expect(screen.getByRole('status')).toHaveTextContent('First System');
  });

  it('keeps the active system inside either rail orientation', () => {
    render(<ProjectDirectory projects={projects} />);
    scrollTo.mockClear();
    vi.spyOn(rail(), 'getBoundingClientRect').mockReturnValue(bounds(0, 0, 100, 100));
    vi.spyOn(screen.getByTestId('project-second-system'), 'getBoundingClientRect').mockReturnValue(
      bounds(120, 0, 40, 40)
    );

    fireEvent.click(screen.getByTestId('project-second-system'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 60, top: 0 });
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

  it('identifies every outbound evidence link as opening a new tab', () => {
    render(<ProjectDirectory projects={projects} />);

    for (const name of [/Live app/, /Repo/, /Write-up/, /Award/]) {
      const link = within(detail()).getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('scrolls a selected item into the vertical rail viewport', () => {
    render(<ProjectDirectory projects={projects} />);
    scrollTo.mockClear();
    vi.spyOn(rail(), 'getBoundingClientRect').mockReturnValue(bounds(0, 0, 100, 100));
    vi.spyOn(screen.getByTestId('project-second-system'), 'getBoundingClientRect').mockReturnValue(
      bounds(0, 120.2, 40, 40)
    );

    fireEvent.click(screen.getByTestId('project-second-system'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 61 });
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
