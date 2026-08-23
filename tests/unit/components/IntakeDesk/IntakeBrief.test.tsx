import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntakeBrief from '@/components/IntakeDesk/IntakeBrief';

type ChatState = {
  messages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }>;
  status: string;
  error?: Error;
};

const chat = vi.hoisted(
  () => ({ state: { messages: [], status: 'ready' } }) as { state: ChatState }
);
const captured = vi.hoisted(() => ({ options: undefined as Record<string, unknown> | undefined }));

vi.mock('algoliasearch/lite', () => ({ liteClient: () => ({}) }));

vi.mock('react-instantsearch', () => ({
  InstantSearch: ({ children }: { children: ReactNode }) => <>{children}</>,
  useChat: (options: Record<string, unknown>) => {
    captured.options = options;
    return chat.state;
  },
}));

const QUESTION = 'Our AI-generated code breaks in production.';

describe('IntakeBrief', () => {
  beforeEach(() => {
    chat.state = { messages: [], status: 'ready' };
    captured.options = undefined;
  });

  it('sends the question once, on mount, with no chat trigger', () => {
    render(<IntakeBrief question={QUESTION} />);

    expect(captured.options?.initialUserMessage).toBe(QUESTION);
    // The connector asserts a trigger or AI mode otherwise, and this is an input
    // on a page rather than a chat that opens.
    expect(captured.options?.disableTriggerValidation).toBe(true);
  });

  it.each(['submitted', 'streaming'])('renders nothing of the answer while %s', (status) => {
    // A brief that assembles under the reader is a chat window. Mid-stream text
    // is deliberately withheld even though it is already available.
    chat.state = {
      status,
      messages: [{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Half an ans' }] }],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/reading the evidence/i)).toBeVisible();
    expect(screen.queryByText(/Half an ans/)).not.toBeInTheDocument();
  });

  it('renders the settled answer', () => {
    chat.state = {
      status: 'ready',
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: QUESTION }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'I have shipped that.' }] },
      ],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText('I have shipped that.')).toBeVisible();
    expect(screen.getByText(QUESTION)).toBeVisible();
  });

  it('splits the answer on blank lines rather than rendering one block', () => {
    chat.state = {
      status: 'ready',
      messages: [
        {
          id: '2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'First point.\n\nSecond point.' }],
        },
      ],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText('First point.')).toBeVisible();
    expect(screen.getByText('Second point.')).toBeVisible();
  });

  it('reads the latest answer when more than one turn exists', () => {
    chat.state = {
      status: 'ready',
      messages: [
        { id: '1', role: 'assistant', parts: [{ type: 'text', text: 'An older answer.' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'The current answer.' }] },
      ],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText('The current answer.')).toBeVisible();
    expect(screen.queryByText('An older answer.')).not.toBeInTheDocument();
  });

  it('says the agent failed and names what still works', () => {
    chat.state = { status: 'error', error: new Error('gone'), messages: [] };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/could not answer/i)).toBeVisible();
    expect(screen.getByRole('link', { name: /Search the index/i })).toHaveAttribute(
      'href',
      '/notes'
    );
    expect(screen.getByRole('link', { name: /shipped/i })).toHaveAttribute('href', '/projects');
  });

  it('reports a failure carried on the error alone', () => {
    // The transport can hand back an error while status has already settled.
    chat.state = { status: 'ready', error: new Error('network'), messages: [] };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/could not answer/i)).toBeVisible();
  });

  it('keeps waiting when the turn settles with no text in it', () => {
    chat.state = {
      status: 'ready',
      messages: [{ id: '2', role: 'assistant', parts: [{ type: 'reasoning', text: 'Thinking.' }] }],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/reading the evidence/i)).toBeVisible();
    expect(screen.queryByText('Thinking.')).not.toBeInTheDocument();
  });
});
