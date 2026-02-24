import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator';

const mockStatus = vi.fn();

vi.mock('react-instantsearch', () => ({
  useInstantSearch: () => ({ status: mockStatus() }),
}));

describe('LoadingIndicator', () => {
  it('returns null when status is idle', () => {
    mockStatus.mockReturnValue('idle');
    const { container } = render(<LoadingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('shows spinner when status is stalled', () => {
    mockStatus.mockReturnValue('stalled');
    render(<LoadingIndicator />);
    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });

  it('shows spinner when status is loading', () => {
    mockStatus.mockReturnValue('loading');
    render(<LoadingIndicator />);
    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });
});
