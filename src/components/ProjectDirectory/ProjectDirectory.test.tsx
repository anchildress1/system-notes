import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockProject } from '@/test-utils/fixtures';
import ProjectDirectory from './ProjectDirectory';

describe('ProjectDirectory', () => {
  it('renders current and ended projects in one directory', () => {
    const ended = { ...mockProject, id: 'ended', title: 'Ended Project', status: 'Archived' };
    render(<ProjectDirectory projects={[mockProject, ended]} />);

    expect(screen.getByRole('heading', { name: 'Current' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ended' })).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Ended Project')).toBeInTheDocument();
  });

  it('reveals full project evidence and cross-links to filtered notes', () => {
    const project = {
      ...mockProject,
      status: 'Active · Deployed',
      app_url: 'https://example.com',
      award: 'Test Award',
      blog_posts: [{ title: 'Build post', url: 'https://dev.to/test/post' }],
    };
    render(<ProjectDirectory projects={[project]} />);

    const entry = screen.getByTestId('project-test-project');
    fireEvent.click(within(entry).getByText('Test Project'));

    expect(within(entry).getByText('Test Award')).toBeInTheDocument();
    expect(within(entry).getByText('Long detailed description.')).toBeInTheDocument();
    expect(within(entry).getByText('Why it exists')).toBeInTheDocument();
    expect(within(entry).getByText('Outcome')).toBeInTheDocument();
    expect(within(entry).getByText('React')).toBeInTheDocument();
    expect(
      within(entry).getByRole('link', { name: /Search this project in the index/i })
    ).toHaveAttribute('href', '/?project=Test+Project#notes-index');
    expect(within(entry).getByRole('link', { name: /Open app/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(within(entry).getByRole('link', { name: /Build post/i })).toHaveAttribute(
      'target',
      '_blank'
    );
  });

  it('uses a numbered fallback and omits unavailable detail sections', () => {
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
    fireEvent.click(within(entry).getByText('Test Project'));

    expect(within(entry).getAllByText('01').length).toBeGreaterThan(0);
    expect(within(entry).queryByText('Why it exists')).not.toBeInTheDocument();
    expect(within(entry).queryByText('Outcome')).not.toBeInTheDocument();
    expect(within(entry).queryByText('Technology')).not.toBeInTheDocument();
    expect(within(entry).queryByRole('link', { name: /View source/i })).not.toBeInTheDocument();
  });

  it('renders empty group counts when the registry is empty', () => {
    render(<ProjectDirectory projects={[]} />);

    expect(screen.getAllByText('00')).toHaveLength(2);
  });
});
