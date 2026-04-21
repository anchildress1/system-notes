import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

describe('ProjectCard Component', () => {
  it('renders project details correctly', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('The core purpose of the project.')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('ANCHildress1')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    // The onClick is on the motion.div, which wraps everything.
    // Testing library's click on an inner element should bubble up.
    fireEvent.click(screen.getByText('Test Project'));

    expect(handleSelect).toHaveBeenCalledWith(mockProject);
  });

  it('renders placeholder if no image provided', () => {
    const noImageProject = { ...mockProject, image_url: undefined };
    render(<ProjectCard project={noImageProject} onSelect={() => {}} />);

    // Checks for initials
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('opens GitHub URL on link click and stops propagation', () => {
    const handleSelect = vi.fn();
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    const link = screen.getByLabelText(`View ${mockProject.title} source code on GitHub`);
    fireEvent.click(link);

    expect(openSpy).toHaveBeenCalledWith(mockProject.repo_url, '_blank', 'noopener,noreferrer');
    expect(handleSelect).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('opens GitHub URL on repeated clicks without calling onSelect', () => {
    const openSpy = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);

    const button = screen.getByLabelText(`View ${mockProject.title} source code on GitHub`);

    fireEvent.click(button);
    expect(openSpy).toHaveBeenCalledWith(mockProject.repo_url, '_blank', 'noopener,noreferrer');

    fireEvent.click(button);
    expect(openSpy).toHaveBeenCalledTimes(2);

    openSpy.mockRestore();
  });

  it('shows ARCHIVED badge for archived projects', () => {
    const archivedProject = { ...mockProject, status: 'Archived' };
    render(<ProjectCard project={archivedProject} onSelect={() => {}} />);
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
  });

  it('does not show ARCHIVED badge for active projects', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);
    expect(screen.queryByText('ARCHIVED')).not.toBeInTheDocument();
  });

  it('renders award badge when project has an award', () => {
    const awardProject = { ...mockProject, award: 'Best in Show' };
    render(<ProjectCard project={awardProject} onSelect={() => {}} />);
    expect(screen.getByText('Best in Show')).toBeInTheDocument();
  });

  it('does not render award badge when project has no award', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);
    expect(screen.queryByText('Best in Show')).not.toBeInTheDocument();
  });

  it('calls onSelect when Enter key is pressed on the card', () => {
    const handleSelect = vi.fn();
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    const card = screen.getByTestId(`project-card-${mockProject.id}`);
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(mockProject);
  });

  it('calls onSelect when Space key is pressed on the card', () => {
    const handleSelect = vi.fn();
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    const card = screen.getByTestId(`project-card-${mockProject.id}`);
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleSelect).toHaveBeenCalledWith(mockProject);
  });

  it('does not call onSelect for non-activation keys', () => {
    const handleSelect = vi.fn();
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    const card = screen.getByTestId(`project-card-${mockProject.id}`);
    fireEvent.keyDown(card, { key: 'Tab' });
    fireEvent.keyDown(card, { key: 'ArrowDown' });

    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('shows ChecKMarKDevTools badge for non-anchildress1 owner', () => {
    const externalProject = { ...mockProject, owner: 'checkmarkdevtools' };
    render(<ProjectCard project={externalProject} onSelect={() => {}} />);
    expect(screen.getByText('ChecKMarKDevTools')).toBeInTheDocument();
  });

  it('does not render GitHub button when repo_url is absent', () => {
    const noRepoProject = { ...mockProject, repo_url: undefined };
    render(<ProjectCard project={noRepoProject} onSelect={() => {}} />);
    expect(
      screen.queryByLabelText(`View ${mockProject.title} source code on GitHub`)
    ).not.toBeInTheDocument();
  });
});
