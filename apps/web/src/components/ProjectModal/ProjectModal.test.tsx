import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectModal from './ProjectModal';
import { Project } from '@/data/projects';

// Mock next/image
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} alt={props.alt || ''} />
  ),
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'Short description',
  longDescription: 'Long description',
  imageUrl: '/test-image.jpg',
  imageAlt: 'Test Image',
  technologies: ['React', 'TypeScript'],
  repoUrl: 'https://github.com/test/repo',
  demoUrl: 'https://test.com',
  featured: true,
  owner: 'anchildress1',
  category: 'Web App',
  status: 'In Development',
  tech: [{ name: 'React', role: 'Frontend' }],
};

describe('ProjectModal Component', () => {
  const onCloseMock = vi.fn();

  it('renders project details correctly', () => {
    render(<ProjectModal project={mockProject} onClose={onCloseMock} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Long description')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ProjectModal project={mockProject} onClose={onCloseMock} />);

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<ProjectModal project={mockProject} onClose={onCloseMock} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCloseMock).toHaveBeenCalled();
  });
});
