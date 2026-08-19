import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockProject } from '@/test-utils/fixtures';
import ProjectDirectory, { exhibitLabel } from './ProjectDirectory';

describe('exhibitLabel', () => {
  it('letters exhibits from the start of the alphabet', () => {
    expect(exhibitLabel(0)).toBe('A');
    expect(exhibitLabel(19)).toBe('T');
    expect(exhibitLabel(25)).toBe('Z');
  });

  it('falls back to a number once the alphabet runs out', () => {
    // Twenty projects fit today; a twenty-seventh must not render undefined.
    expect(exhibitLabel(26)).toBe('27');
    expect(exhibitLabel(40)).toBe('41');
  });
});

describe('ProjectDirectory', () => {
  it('letters every project as one uninterrupted run of exhibits', () => {
    const second = { ...mockProject, id: 'ended', title: 'Ended Project', status: 'Archived' };
    render(<ProjectDirectory projects={[mockProject, second]} />);

    expect(screen.getByText('Exhibit A')).toBeInTheDocument();
    expect(screen.getByText('Exhibit B')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Project' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ended Project' })).toBeInTheDocument();
    // Status rides on each exhibit, so the page needs no Current/Ended split.
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Current' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ended' })).not.toBeInTheDocument();
  });

  it('states the exhibit, its stack, and where its cards are filed', () => {
    const project = {
      ...mockProject,
      status: 'Active · Deployed',
      app_url: 'https://example.com',
      award: 'Test Award',
      blog_posts: [{ title: 'Build post', url: 'https://dev.to/test/post' }],
    };
    render(<ProjectDirectory projects={[project]} />);
    const entry = screen.getByTestId('project-test-project');

    expect(within(entry).getByText('Exhibit A')).toBeInTheDocument();
    expect(within(entry).getByText('Active · Deployed')).toBeInTheDocument();
    expect(within(entry).getByText(/Test Award/)).toBeInTheDocument();
    expect(within(entry).getByText('Long detailed description.')).toBeInTheDocument();
    expect(within(entry).getByRole('list', { name: /Test Project stack/i })).toBeInTheDocument();
    expect(within(entry).getByText('React')).toBeInTheDocument();

    expect(
      within(entry).getByRole('link', { name: /cards filed under this exhibit/i })
    ).toHaveAttribute('href', '/?project=Test+Project#notes-index');
    expect(within(entry).getByRole('link', { name: /launch/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(within(entry).getByRole('link', { name: /Build post/i })).toHaveAttribute(
      'target',
      '_blank'
    );
  });

  it('keeps the deeper evidence behind a disclosure rather than dropping it', () => {
    render(<ProjectDirectory projects={[mockProject]} />);
    const entry = screen.getByTestId('project-test-project');

    // Present in the DOM but collapsed — the exhibit reads as the spec draws it.
    const disclosure = within(entry).getByText('evidence');
    expect(disclosure.closest('details')).not.toHaveAttribute('open');
    expect(within(entry).getByRole('heading', { name: 'Why it exists' })).toBeInTheDocument();
    expect(within(entry).getByRole('heading', { name: 'Outcome' })).toBeInTheDocument();
    // The fixture carries no image_alt, so the title-derived fallback applies.
    expect(within(entry).getByRole('img')).toHaveAttribute('alt', 'Test Project project preview');
  });

  it('omits every optional part a project does not have', () => {
    render(
      <ProjectDirectory
        projects={[
          {
            ...mockProject,
            image_url: undefined,
            image_alt: undefined,
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

    // No purpose, outcome, or image means there is no evidence to disclose.
    expect(within(entry).queryByText('evidence')).not.toBeInTheDocument();
    expect(within(entry).queryByRole('list', { name: /stack/i })).not.toBeInTheDocument();
    expect(within(entry).queryByRole('link', { name: /^repo/i })).not.toBeInTheDocument();
    expect(within(entry).queryByRole('link', { name: /^launch/i })).not.toBeInTheDocument();
    // The summary falls back to the short description when there is no long one.
    expect(within(entry).getByText('Short description tagline.')).toBeInTheDocument();
  });

  it('says so rather than leaving a status blank', () => {
    render(<ProjectDirectory projects={[{ ...mockProject, status: '' }]} />);

    expect(screen.getByText('Status unavailable')).toBeInTheDocument();
  });

  it('renders nothing but an empty list for an empty registry', () => {
    const view = render(<ProjectDirectory projects={[]} />);

    expect(view.container.querySelectorAll('article')).toHaveLength(0);
    expect(screen.queryByText(/^Exhibit /)).not.toBeInTheDocument();
  });
});
