import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  it('renders the generic failure path without leaking the error message', () => {
    render(<GlobalError error={new Error('secret internal path')} retry={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'The failure path works.' })).toBeInTheDocument();
    expect(screen.getByText(/stopped before it could produce/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret internal path/i)).not.toBeInTheDocument();
  });

  it('renders the safe digest when Next provides one', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<GlobalError error={error} retry={vi.fn()} />);

    expect(screen.getByText(/reference abc123/i)).toBeInTheDocument();
  });

  it('calls retry from the native retry control', () => {
    const retry = vi.fn();
    render(<GlobalError error={new Error('boom')} retry={retry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('survives a thrown value that is not an Error', () => {
    render(<GlobalError error="a bare string" retry={vi.fn()} />);

    expect(screen.getByText(/stopped before it could produce/i)).toBeInTheDocument();
  });
});
