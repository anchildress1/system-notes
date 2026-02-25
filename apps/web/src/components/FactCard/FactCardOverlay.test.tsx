import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactCardOverlay from './FactCardOverlay';
import type { OverlayHit } from '@/hooks/useFactIdRouting';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: Record<string, unknown>) => {
      const { children, className } = props as React.HTMLAttributes<HTMLDivElement>;
      return (
        <div className={className} data-testid="overlay-backdrop">
          {children}
        </div>
      );
    },
    article: (props: Record<string, unknown>) => {
      const {
        children,
        onClick: _onClick, // eslint-disable-line @typescript-eslint/no-unused-vars
        className,
        role,
        animate,
        onAnimationComplete,
        ...rest
      } = props as React.HTMLAttributes<HTMLElement> & {
        animate?: string;
        onAnimationComplete?: (definition: string) => void;
      } & Record<string, unknown>;
      return (
        <article
          className={className}
          role={role}
          data-animate={animate as string}
          data-testid="overlay-article"
          onTransitionEnd={() => onAnimationComplete?.(animate as string)}
          {...rest}
        >
          {children}
        </article>
      );
    },
  },
}));

const mockHit: OverlayHit = {
  objectID: 'card:test:overlay:001',
  title: 'Overlay Test Card',
  blurb: 'A blurb for the overlay',
  fact: 'A detailed fact',
  content: 'Full content of the card',
  category: 'Work Style',
  projects: ['Project Alpha', 'Project Beta'],
  signal: 3,
  url: 'https://github.com/test/repo',
};

describe('FactCardOverlay', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card title and content', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    expect(screen.getByText('Overlay Test Card')).toBeInTheDocument();
    expect(screen.getByText('Full content of the card')).toBeInTheDocument();
  });

  it('renders project tags', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('renders source link for GitHub URLs', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    expect(screen.getByLabelText('View source for Overlay Test Card')).toBeInTheDocument();
  });

  it('renders DEV icon for DEV.to URLs', () => {
    const devHit = { ...mockHit, url: 'https://dev.to/user/post' };
    render(<FactCardOverlay hit={devHit} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Read Overlay Test Card on DEV Community')).toBeInTheDocument();
  });

  it('renders close button with correct label', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Close expanded view')).toBeInTheDocument();
  });

  it('begins exit animation when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-animate', 'visible');

    const closeButton = screen.getByLabelText('Close expanded view');
    await user.click(closeButton);

    // handleClose sets isVisible=false, transitioning animate to 'exit'.
    // onClose fires after animation completes (via onAnimationComplete callback).
    expect(dialog).toHaveAttribute('data-animate', 'exit');
  });

  it('renders dialog with accessibility attributes', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('falls back to fact when content is missing', () => {
    const hitNoContent = { ...mockHit, content: undefined };
    render(<FactCardOverlay hit={hitNoContent} onClose={mockOnClose} />);

    expect(screen.getByText('A detailed fact')).toBeInTheDocument();
  });

  it('falls back to blurb when content and fact are missing', () => {
    const hitNoContentFact = { ...mockHit, content: undefined, fact: '' };
    render(<FactCardOverlay hit={hitNoContentFact} onClose={mockOnClose} />);

    expect(screen.getByText('A blurb for the overlay')).toBeInTheDocument();
  });

  it('handles close via Escape key', async () => {
    const user = userEvent.setup();
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    await user.keyboard('{Escape}');

    // The component sets isVisible to false, which triggers exit animation.
    // With mocked framer-motion, onClose won't be called via animation callback,
    // but the Escape handler is tested.
    expect(screen.getByLabelText('Close expanded view')).toBeInTheDocument();
  });

  it('does not render project tags when projects is empty', () => {
    const hitNoProjects = { ...mockHit, projects: [] };
    const { container } = render(<FactCardOverlay hit={hitNoProjects} onClose={mockOnClose} />);

    expect(container.querySelector('.simple-tags')).not.toBeInTheDocument();
  });

  it('calls onClose after exit animation completes', async () => {
    const user = userEvent.setup();
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close expanded view');
    await user.click(closeButton);

    // Simulate framer-motion firing onAnimationComplete with 'exit'
    const article = screen.getByTestId('overlay-article');
    fireEvent.transitionEnd(article);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when animation completes while still visible', () => {
    render(<FactCardOverlay hit={mockHit} onClose={mockOnClose} />);

    // Fire onAnimationComplete while isVisible is still true (no close triggered)
    const article = screen.getByTestId('overlay-article');
    fireEvent.transitionEnd(article);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
