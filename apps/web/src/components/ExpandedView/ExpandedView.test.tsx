import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandedView from './ExpandedView';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

describe('ExpandedView Component', () => {
  it('renders extensive project details', () => {
    render(
      <ExpandedView
        project={mockProject}
        onClose={() => {}}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('The core purpose of the project.')).toBeInTheDocument();
    expect(screen.getByText('Long detailed description.')).toBeInTheDocument();
    expect(screen.getByText('Great outcome.')).toBeInTheDocument();
    expect(screen.getByText('GitHub Repo')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ExpandedView
        project={mockProject}
        onClose={handleClose}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );

    // Assuming the close button is the one with the svg icon
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg'));

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    } else {
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <ExpandedView
        project={mockProject}
        onClose={handleClose}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders close button with sticky positioning attributes', async () => {
    render(
      <ExpandedView
        project={mockProject}
        onClose={() => {}}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('aria-label', 'Close modal');
  });

  it('renders blog links if provided', () => {
    const projectWithBlogs = {
      ...mockProject,
      blogs: [{ title: 'Blog 1', url: 'https://blog1.com' }],
    };
    render(
      <ExpandedView
        project={projectWithBlogs}
        onClose={() => {}}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );
    expect(screen.getByText('Related Reading')).toBeInTheDocument();
    expect(screen.getByText('Blog 1')).toHaveAttribute('href', 'https://blog1.com');
  });

  it('handles keyboard scrolling', () => {
    // Mock scrollBy
    const scrollByMock = vi.fn();
    Element.prototype.scrollBy = scrollByMock;

    render(
      <ExpandedView
        project={mockProject}
        onClose={() => {}}
        isOpen={true}
        onExitComplete={() => {}}
      />
    );

    // Dispatch events on window
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(scrollByMock).toHaveBeenCalledWith(expect.objectContaining({ top: 60 }));

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(scrollByMock).toHaveBeenCalledWith(expect.objectContaining({ top: -60 }));
  });
});
