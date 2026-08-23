import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntakeDesk, { SEEDS } from '@/components/IntakeDesk/IntakeDesk';

const agent = vi.hoisted(() => ({ reachable: true }));

vi.mock('@/lib/algolia', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/algolia')>()),
  hasValidAgentCredentials: () => agent.reachable,
}));

// The real one pulls in InstantSearch and the agent transport. What matters here
// is which question reaches it, and how many times.
vi.mock('@/components/IntakeDesk/IntakeBriefLoader', () => ({
  default: ({ question }: { question: string }) => <div data-testid="brief">{question}</div>,
}));

const field = () => screen.getByLabelText('The problem');
const run = () => screen.getByRole('button', { name: 'Run it' });

describe('IntakeDesk', () => {
  beforeEach(() => {
    agent.reachable = true;
  });

  it('asks nothing until it is asked', () => {
    render(<IntakeDesk />);

    expect(field()).toHaveValue('');
    expect(screen.queryByTestId('brief')).not.toBeInTheDocument();
  });

  it('sends the question on submit', () => {
    render(<IntakeDesk />);

    fireEvent.change(field(), { target: { value: 'Our agents ship unreviewed code.' } });
    fireEvent.click(run());

    expect(screen.getByTestId('brief')).toHaveTextContent('Our agents ship unreviewed code.');
  });

  it('sends the trimmed question, not the whitespace around it', () => {
    render(<IntakeDesk />);

    fireEvent.change(field(), { target: { value: '   Something breaks.   ' } });
    fireEvent.click(run());

    expect(screen.getByTestId('brief')).toHaveTextContent('Something breaks.');
  });

  it('refuses an empty question', () => {
    render(<IntakeDesk />);

    fireEvent.change(field(), { target: { value: '    ' } });
    fireEvent.click(run());

    expect(screen.queryByTestId('brief')).not.toBeInTheDocument();
  });

  it('does not re-ask while the reader edits the field', () => {
    // Typing after an answer must not send another question; only submitting does.
    render(<IntakeDesk />);
    fireEvent.change(field(), { target: { value: 'First question.' } });
    fireEvent.click(run());

    fireEvent.change(field(), { target: { value: 'Second question, still typing.' } });

    expect(screen.getByTestId('brief')).toHaveTextContent('First question.');
  });

  it('loads a shelf problem into the field without asking it', () => {
    render(<IntakeDesk />);

    fireEvent.click(screen.getByRole('button', { name: SEEDS[0] }));

    expect(field()).toHaveValue(SEEDS[0]);
    expect(screen.queryByTestId('brief')).not.toBeInTheDocument();
  });

  it('offers every shelf problem as its own control', () => {
    render(<IntakeDesk />);

    for (const seed of SEEDS) {
      expect(screen.getByRole('button', { name: seed })).toBeEnabled();
    }
  });

  describe('when the agent is unreachable', () => {
    beforeEach(() => {
      agent.reachable = false;
    });

    it('parks the control and says why on the field itself', () => {
      // A disabled button cannot be focused, so the explanation has to reach the
      // reader through the control they can still land on.
      render(<IntakeDesk />);

      expect(run()).toBeDisabled();
      expect(field()).toHaveAccessibleDescription(/agent is not reachable/i);
    });

    it('names what still works instead', () => {
      render(<IntakeDesk />);

      expect(screen.getByText(/index and the exhibits/i)).toBeVisible();
    });

    it('sends nothing even if the form is submitted', () => {
      render(<IntakeDesk />);

      fireEvent.change(field(), { target: { value: 'Anything at all.' } });
      fireEvent.submit(run().closest('form') as HTMLFormElement);

      expect(screen.queryByTestId('brief')).not.toBeInTheDocument();
    });
  });
});
