import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectModal from './ProjectModal';
import { Project } from '@/data/projects';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} alt={props.alt || ''} />
  ),
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  status: 'Active · Testing',
  description: 'Short description',
  purpose: 'Test purpose for the project',
  longDescription: 'Long description',
  outcome: 'Test outcome for the project',
  imageUrl: '/test-image.jpg',
  imageAlt: 'Test Image',
  tech: [{ name: 'React', role: 'Frontend' }],
  repoUrl: 'https://github.com/test/repo',
  owner: 'anchildress1',
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
