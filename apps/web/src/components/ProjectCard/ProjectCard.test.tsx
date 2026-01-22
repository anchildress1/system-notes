import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project } from '@/data/projects';

// Mock Next.js Image
vi.mock('next/image', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'This is a test project.',
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
    expect(screen.getByText('This is a test project.')).toBeInTheDocument();
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
});
