import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project } from '@/data/projects';

// Mock Next.js Image
vi.mock('next/image', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ fill: _fill, priority: _priority, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  ),
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'This is a test tagline.',
  purpose: 'This is a test purpose statement.',
  longDescription: 'Long detailed description.',
  outcome: 'Outcome details.',
  tech: [{ name: 'React', role: 'Frontend' }],
  repoUrl: 'https://github.com/test/test-project',
  owner: 'anchildress1',
  status: 'Active',
  imageUrl: '/test-image.jpg',
};

describe('ProjectCard Component', () => {
  it('renders project details correctly', () => {
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('This is a test purpose statement.')).toBeInTheDocument();
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
    const noImageProject = { ...mockProject, imageUrl: undefined };
    render(<ProjectCard project={noImageProject} onSelect={() => {}} />);

    // Checks for initials
    expect(screen.getByText('TE')).toBeInTheDocument();
  });
  it('opens GitHub URL on link click and stops propagation', () => {
    const handleSelect = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ProjectCard project={mockProject} onSelect={handleSelect} />);

    const link = screen.getByLabelText(`View ${mockProject.title} source code on GitHub`);
    fireEvent.click(link);

    expect(openSpy).toHaveBeenCalledWith(mockProject.repoUrl, '_blank', 'noopener,noreferrer');
    expect(handleSelect).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('opens GitHub URL on Enter/Space key', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ProjectCard project={mockProject} onSelect={() => {}} />);

    const link = screen.getByLabelText(`View ${mockProject.title} source code on GitHub`);

    fireEvent.keyDown(link, { key: 'Enter' });
    expect(openSpy).toHaveBeenCalledWith(mockProject.repoUrl, '_blank', 'noopener,noreferrer');

    fireEvent.keyDown(link, { key: ' ' });
    expect(openSpy).toHaveBeenCalledTimes(2);

    openSpy.mockRestore();
  });
});
