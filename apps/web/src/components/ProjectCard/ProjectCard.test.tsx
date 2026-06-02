import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

const flipToggle = (project = mockProject) =>
  within(screen.getByTestId(`project-card-${project.id}`)).getByRole('button', {
    name: /flip to read/i,
  });

const backOf = (project = mockProject) => screen.getByTestId(`project-detail-${project.id}`);

describe('ProjectCard Component', () => {
  it('renders the front summary correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Test Project' })).toBeInTheDocument();
    expect(screen.getByText('The core purpose of the project.')).toBeInTheDocument();
    expect(screen.getByText('ANCHildress1')).toBeInTheDocument();
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
  });

  it('starts unflipped: toggle collapsed, back hidden from AT', () => {
    render(<ProjectCard project={mockProject} />);

    expect(flipToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(backOf()).toHaveAttribute('aria-hidden', 'true');
  });

  it('flips to reveal the note on click', () => {
    render(<ProjectCard project={mockProject} />);

    // Flipping marks the front (and its toggle) aria-hidden, so capture the
    // node before the click rather than re-querying by role afterwards.
    const toggle = flipToggle();
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(backOf()).toHaveAttribute('aria-hidden', 'false');
    expect(within(backOf()).getByText('Long detailed description.')).toBeInTheDocument();
    expect(within(backOf()).getByText('Great outcome.')).toBeInTheDocument();
  });

  it('flips back via the close button', () => {
    render(<ProjectCard project={mockProject} />);

    fireEvent.click(flipToggle());
    fireEvent.click(screen.getByRole('button', { name: /back to summary/i }));

    expect(flipToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('flips back when Escape is pressed', () => {
    render(<ProjectCard project={mockProject} />);

    const toggle = flipToggle();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(globalThis, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders placeholder if no image provided', () => {
    render(<ProjectCard project={{ ...mockProject, image_url: undefined }} />);
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('opens GitHub URL on source-link click without flipping', () => {
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    render(<ProjectCard project={mockProject} />);

    fireEvent.click(screen.getByLabelText(`View ${mockProject.title} source code on GitHub`));

    expect(openSpy).toHaveBeenCalledWith(mockProject.repo_url, '_blank', 'noopener,noreferrer');
    expect(flipToggle()).toHaveAttribute('aria-expanded', 'false');
    openSpy.mockRestore();
  });

  it('shows ARCHIVED badge for archived projects', () => {
    render(<ProjectCard project={{ ...mockProject, status: 'Archived' }} />);
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
  });

  it('does not show ARCHIVED badge for active projects', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.queryByText('ARCHIVED')).not.toBeInTheDocument();
  });

  it('renders award badge when project has an award', () => {
    render(<ProjectCard project={{ ...mockProject, award: 'Best in Show' }} />);
    expect(screen.getByText('Best in Show')).toBeInTheDocument();
  });

  it('does not render award badge when project has no award', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.queryByText('Best in Show')).not.toBeInTheDocument();
  });

  it('renders related reading links on the back when blog posts exist', () => {
    const withBlog = {
      ...mockProject,
      blog_posts: [{ title: 'How it was built', url: 'https://dev.to/anchildress1/post' }],
    };
    render(<ProjectCard project={withBlog} />);

    // Back-face links are aria-hidden until the card is flipped.
    fireEvent.click(flipToggle(withBlog));

    const link = within(backOf(withBlog)).getByRole('link', { name: 'How it was built' });
    expect(link).toHaveAttribute('href', 'https://dev.to/anchildress1/post');
  });

  it('shows ChecKMarKDevTools badge for non-anchildress1 owner', () => {
    render(<ProjectCard project={{ ...mockProject, owner: 'checkmarkdevtools' }} />);
    expect(screen.getByText('ChecKMarKDevTools')).toBeInTheDocument();
  });

  it('does not render GitHub source button when repo_url is absent', () => {
    render(<ProjectCard project={{ ...mockProject, repo_url: undefined }} />);
    expect(
      screen.queryByLabelText(`View ${mockProject.title} source code on GitHub`)
    ).not.toBeInTheDocument();
  });
});
