import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandedView from './ExpandedView';
import { Project } from '@/data/projects';

// Mock Next.js Image
vi.mock('next/image', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'Short description.',
  longDescription: 'Long detailed description.',
  outcome: 'Great outcome.',
  tech: [{ name: 'React', role: 'Frontend' }],
  repoUrl: 'https://github.com/test/test-project',
  owner: 'anchildress1',
  status: 'Completed',
  imageUrl: '/test.jpg',
};

describe('ExpandedView Component', () => {
  it('renders extensive project details', () => {
    render(<ExpandedView project={mockProject} onClose={() => {}} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Long detailed description.')).toBeInTheDocument();
    expect(screen.getByText('Great outcome.')).toBeInTheDocument();
    expect(screen.getByText('View Source on GitHub')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ExpandedView project={mockProject} onClose={handleClose} />);

    // Assuming the close button is the one with the svg icon, or we can look for role="button" if accessible.
    // The close button is a <button> with an svg inside.
    const closeButtons = screen.getAllByRole('button');
    // There might be multiple buttons if we count the link (usually links are role link, but let's be specific).
    // The close button has the svg.
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg'));

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    } else {
      // Fallback if role lookup fails (though it shouldn't)
      // Check for click on overlay/background if specifically testing that behavior.
      // For now, let's try to find it by class or just rely on the first button if it's the only one.
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<ExpandedView project={mockProject} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
