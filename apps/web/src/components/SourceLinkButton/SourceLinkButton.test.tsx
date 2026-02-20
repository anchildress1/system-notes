import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourceLinkButton from './SourceLinkButton';

describe('SourceLinkButton', () => {
  const defaultProps = {
    url: 'https://github.com/test/repo',
    label: 'View source',
    icon: <span data-testid="test-icon">icon</span>,
  };

  it('renders with icon and label', () => {
    render(<SourceLinkButton {...defaultProps} />);
    expect(screen.getByLabelText('View source')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('opens URL in new tab on click', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<SourceLinkButton {...defaultProps} />);

    await user.click(screen.getByLabelText('View source'));

    expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/test/repo',
      '_blank',
      'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });

  it('calls custom onClick instead of window.open when provided', async () => {
    const user = userEvent.setup();
    const customClick = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<SourceLinkButton {...defaultProps} onClick={customClick} />);

    await user.click(screen.getByLabelText('View source'));

    expect(customClick).toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('stops event propagation', async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <div onClick={parentClick}>
        <SourceLinkButton {...defaultProps} />
      </div>
    );

    await user.click(screen.getByLabelText('View source'));

    expect(parentClick).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
