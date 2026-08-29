import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const BRIEF_KEY = 'system-notes-intake-brief';

vi.mock('@/lib/algolia', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/algolia')>()),
  hasValidAgentCredentials: () => true,
}));

// Settles immediately so the desk receives an answer to keep.
vi.mock('@/components/IntakeDesk/IntakeBriefLoader', () => ({
  default: ({ question, onSettled }: { question: string; onSettled?: (a: string) => void }) => (
    <button type="button" data-testid="settle" onClick={() => onSettled?.(`Answer to ${question}`)}>
      {question}
    </button>
  ),
}));

/**
 * The kept brief is cached at module scope, so a fresh import is what a fresh
 * page load actually is. Importing once at the top would let one test's brief
 * leak into the next.
 */
const loadDesk = async () => (await import('@/components/IntakeDesk/IntakeDesk')).default;

describe('brief persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.resetModules();
  });

  it('keeps a settled brief so leaving the page does not discard it', async () => {
    const IntakeDesk = await loadDesk();
    render(<IntakeDesk />);

    fireEvent.change(screen.getByLabelText('The problem'), { target: { value: 'A problem.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
    fireEvent.click(screen.getByTestId('settle'));

    expect(JSON.parse(sessionStorage.getItem(BRIEF_KEY)!)).toEqual({
      question: 'A problem.',
      answer: 'Answer to A problem.',
    });
  });

  it('renders a kept brief on the next visit without asking again', async () => {
    sessionStorage.setItem(
      BRIEF_KEY,
      JSON.stringify({ question: 'Asked earlier.', answer: 'Answered earlier.' })
    );
    const IntakeDesk = await loadDesk();
    render(<IntakeDesk />);

    expect(screen.getByText('Answered earlier.')).toBeVisible();
    // Restored directly rather than through the agent: returning to the page
    // must not spend a second call.
    expect(screen.queryByTestId('settle')).not.toBeInTheDocument();
  });

  it('shows nothing when the visit has no brief in it', async () => {
    const IntakeDesk = await loadDesk();
    render(<IntakeDesk />);

    expect(screen.queryByRole('region', { name: 'The brief' })).not.toBeInTheDocument();
  });

  it('ignores a stored value another build left behind', async () => {
    sessionStorage.setItem(BRIEF_KEY, JSON.stringify({ question: 'Only half.' }));
    const IntakeDesk = await loadDesk();
    render(<IntakeDesk />);

    expect(screen.queryByRole('region', { name: 'The brief' })).not.toBeInTheDocument();
  });

  it('ignores a stored value that is not json', async () => {
    sessionStorage.setItem(BRIEF_KEY, 'not json');
    const IntakeDesk = await loadDesk();
    render(<IntakeDesk />);

    expect(screen.queryByRole('region', { name: 'The brief' })).not.toBeInTheDocument();
  });
});
