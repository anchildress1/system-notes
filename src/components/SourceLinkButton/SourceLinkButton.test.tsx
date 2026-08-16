import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourceLinkButton from './SourceLinkButton';

describe('SourceLinkButton', () => {
  const defaultProps = {
    url: 'https://github.com/test/repo',
    label: 'View source',
    icon: <span data-testid="test-icon">icon</span>,
  };

  it('renders a secure external link with its icon and label', () => {
    render(<SourceLinkButton {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'View source' });
    expect(link).toHaveAttribute('href', defaultProps.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('rejects unsafe URLs', () => {
    render(<SourceLinkButton {...defaultProps} url="javascript:alert(1)" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('applies caller-provided tab index', () => {
    render(<SourceLinkButton {...defaultProps} tabIndex={-1} />);
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');
  });

  it('stops click propagation without cancelling navigation', async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <SourceLinkButton {...defaultProps} />
      </div>
    );

    await user.click(screen.getByRole('link'));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
