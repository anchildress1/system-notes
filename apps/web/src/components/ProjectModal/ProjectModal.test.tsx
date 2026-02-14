import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectModal from './ProjectModal';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

describe('ProjectModal Component', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
  });

  it('renders project details correctly', () => {
    render(<ProjectModal project={mockProject} onClose={onCloseMock} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Long detailed description.')).toBeInTheDocument();
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
