import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from './global-error';

describe('GlobalError', () => {
  it('renders heading and generic message when no digest', () => {
    const error = new Error('boom');
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('renders error digest when present', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.getByText('An unexpected error occurred (abc123).')).toBeInTheDocument();
  });

  it('calls reset when Try again button is clicked', () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error('boom')} reset={reset} />);

    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalledOnce();
  });
});
