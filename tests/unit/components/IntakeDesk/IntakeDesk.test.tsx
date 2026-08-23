import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IntakeDesk, { SEEDS } from '@/components/IntakeDesk/IntakeDesk';

describe('IntakeDesk', () => {
  it('labels the field and describes it with the not-wired notice', () => {
    render(<IntakeDesk />);

    const field = screen.getByLabelText('The problem');
    expect(field).toHaveValue('');
    // The notice is the only thing explaining a disabled control, and a disabled
    // button cannot be focused — so the field has to carry the description.
    expect(field).toHaveAccessibleDescription(/retrieval agent is not connected yet/i);
  });

  it('parks the run control rather than hiding it', () => {
    render(<IntakeDesk />);

    expect(screen.getByRole('button', { name: 'Run it' })).toBeDisabled();
  });

  it('loads a shelf problem into the field', () => {
    render(<IntakeDesk />);

    fireEvent.click(screen.getByRole('button', { name: SEEDS[0] }));

    expect(screen.getByLabelText('The problem')).toHaveValue(SEEDS[0]);
  });

  it('replaces what the reader typed when a shelf problem is chosen', () => {
    render(<IntakeDesk />);

    const field = screen.getByLabelText('The problem');
    fireEvent.change(field, { target: { value: 'something of my own' } });
    expect(field).toHaveValue('something of my own');

    fireEvent.click(screen.getByRole('button', { name: SEEDS[1] }));

    expect(field).toHaveValue(SEEDS[1]);
  });

  it('offers every shelf problem as its own control', () => {
    render(<IntakeDesk />);

    for (const seed of SEEDS) {
      expect(screen.getByRole('button', { name: seed })).toBeEnabled();
    }
  });
});
