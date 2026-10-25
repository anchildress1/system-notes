import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import IntakeBrief from '@/components/IntakeDesk/IntakeBrief';

type ChatState = {
  messages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }>;
  status: string;
  error?: Error;
};

const chat = vi.hoisted(
  () => ({ state: { messages: [], status: 'ready' } }) as { state: ChatState }
);
const captured = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  sent: [] as Array<{ text: string }>,
  stopped: 0,
  stop: vi.fn(() => Promise.resolve()),
  transport: undefined as Record<string, unknown> | undefined,
  send: vi.fn(() => Promise.resolve()),
}));

// The transport is constructed at module scope, so it is stubbed rather than
// exercised: this suite is about what the component does with a turn, not about
// how `ai` builds a request.
vi.mock('ai', () => ({
  DefaultChatTransport: class {
    constructor(options: Record<string, unknown>) {
      captured.transport = options;
    }
  },
}));

vi.mock('@ai-sdk/react', () => ({
  useChat: (options: Record<string, unknown>) => {
    captured.options = options;
    return {
      ...chat.state,
      sendMessage: (message: { text: string }) => {
        captured.sent.push(message);
        return captured.send();
      },
      stop: () => {
        captured.stopped += 1;
        return captured.stop();
      },
    };
  },
}));

const QUESTION = 'Our AI-generated code breaks in production.';

type FinishEvent = {
  message: ChatState['messages'][number];
  messages: ChatState['messages'];
  isAbort: boolean;
  isDisconnect: boolean;
  isError: boolean;
  finishReason?: string;
};

function finishTurn(message = chat.state.messages[0]!, overrides: Partial<FinishEvent> = {}) {
  const onFinish = captured.options?.onFinish as ((event: FinishEvent) => void) | undefined;
  onFinish?.({
    message,
    messages: chat.state.messages,
    isAbort: false,
    isDisconnect: false,
    isError: false,
    // What a whole answer carries. Every other reason means it stopped early.
    finishReason: 'stop',
    ...overrides,
  });
}

describe('IntakeBrief', () => {
  beforeEach(() => {
    chat.state = { messages: [], status: 'ready' };
    captured.options = undefined;
    captured.sent = [];
    captured.stopped = 0;
    captured.stop.mockReset();
    captured.stop.mockResolvedValue(undefined);
    captured.send.mockReset();
    captured.send.mockResolvedValue(undefined);
  });

  afterEach(() => vi.useRealTimers());

  it('sends the question once, on mount', () => {
    render(<IntakeBrief question={QUESTION} />);

    expect(captured.sent).toEqual([{ text: QUESTION }]);
  });

  it('does not re-ask when the component re-renders', () => {
    // The regression this guards: the send used to be handed to the connector as
    // `initialUserMessage`, which cached it in sessionStorage and then refused to
    // send it ever again. Owning the send means owning "exactly once" too.
    const { rerender } = render(<IntakeBrief question={QUESTION} />);
    rerender(<IntakeBrief question={QUESTION} />);

    expect(captured.sent).toHaveLength(1);
  });

  it('sends and settles once during Strict Mode effect replay', () => {
    chat.state = {
      status: 'ready',
      messages: [{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Done.' }] }],
    };
    const onFinished = vi.fn();
    const onSettled = vi.fn();

    render(
      <StrictMode>
        <IntakeBrief question={QUESTION} onFinished={onFinished} onSettled={onSettled} />
      </StrictMode>
    );

    expect(captured.sent).toEqual([{ text: QUESTION }]);
    expect(onSettled).toHaveBeenCalledOnce();
    expect(onSettled).toHaveBeenCalledWith('Done.');
    expect(onFinished).toHaveBeenCalledOnce();
  });

  it('configures the documented Agent Studio streaming transport', () => {
    render(<IntakeBrief question={QUESTION} />);

    expect(captured.options?.transport).toBeDefined();
    expect(captured.transport).toMatchObject({
      api: expect.stringContaining('/agent-studio/1/agents/'),
      headers: {
        'x-algolia-application-id': expect.any(String),
        'x-algolia-api-key': expect.any(String),
      },
    });
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

  it('keeps a completed text answer settled when the finish callback runs', () => {
    chat.state = {
      status: 'ready',
      messages: [{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Done.' }] }],
    };

    render(<IntakeBrief question={QUESTION} />);
    act(() => finishTurn());

    expect(screen.getByText('Done.')).toBeVisible();
    expect(screen.queryByText(/could not answer/i)).not.toBeInTheDocument();
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

  it('discloses that the answer was agent-written', () => {
    // Attribution is the site's own subject — RAI Lint fails commits that lack
    // it. An answer this page generated should not be the one thing that ships
    // without a provenance line.
    chat.state = {
      status: 'ready',
      messages: [{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'An answer.' }] }],
    };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/an ai agent wrote this from evidence/i)).toBeVisible();
  });

  it('reports the turn finished once an answer settles', () => {
    chat.state = {
      status: 'ready',
      messages: [{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Done.' }] }],
    };
    const onFinished = vi.fn();

    render(<IntakeBrief question={QUESTION} onFinished={onFinished} />);

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('reports the turn finished when it fails, so the form is not left disabled', () => {
    // The regression: the desk only re-enabled itself from onSettled, which a
    // failed turn never reaches — the button stayed dead until a reload.
    chat.state = { status: 'error', error: new Error('gone'), messages: [] };
    const onFinished = vi.fn();

    render(<IntakeBrief question={QUESTION} onFinished={onFinished} />);

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('does not report finished while the turn is still running', () => {
    chat.state = { status: 'submitted', messages: [] };
    const onFinished = vi.fn();

    render(<IntakeBrief question={QUESTION} onFinished={onFinished} />);

    expect(onFinished).not.toHaveBeenCalled();
  });

  it('gives up on a turn that never comes back, and says so', () => {
    vi.useFakeTimers();
    chat.state = { status: 'submitted', messages: [] };
    const onFinished = vi.fn();

    render(<IntakeBrief question={QUESTION} onFinished={onFinished} />);
    expect(screen.getByText(/reading the evidence/i)).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(45_000);
    });

    expect(screen.getByText(/did not answer in time/i)).toBeVisible();
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(captured.stopped).toBe(1);
  });

  it('finishes a timed-out turn when stopping the stream rejects', async () => {
    vi.useFakeTimers();
    chat.state = { status: 'submitted', messages: [] };
    captured.stop.mockRejectedValueOnce(new Error('abort failed'));
    const onFinished = vi.fn();
    const onSettled = vi.fn();

    render(<IntakeBrief question={QUESTION} onFinished={onFinished} onSettled={onSettled} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(screen.getByText(/did not answer in time/i)).toBeVisible();
    expect(captured.stop).toHaveBeenCalledOnce();
    expect(onFinished).toHaveBeenCalledOnce();
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('echoes the question on a failed turn, since the field is cleared on submit', () => {
    chat.state = { status: 'error', error: new Error('gone'), messages: [] };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(QUESTION)).toBeVisible();
  });

  it('reports a failure carried on the error alone', () => {
    // The transport can hand back an error while status has already settled.
    chat.state = { status: 'ready', error: new Error('network'), messages: [] };

    render(<IntakeBrief question={QUESTION} />);

    expect(screen.getByText(/could not answer/i)).toBeVisible();
  });

  // Both cases set an error, so `failed` short-circuits on Boolean(error) before
  // status is read: the parameter changes nothing. Kept because the two statuses
  // are both reachable, but the case that actually exercises the guard is the one
  // below, where the SDK reports no failure at all.
  it.each(['error', 'ready'])(
    'does not save a partial answer after failure with status %s',
    (status) => {
      chat.state = {
        status,
        error: new Error('stream interrupted'),
        messages: [{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Incomplete.' }] }],
      };
      const onSettled = vi.fn();
      const onFinished = vi.fn();

      render(<IntakeBrief question={QUESTION} onSettled={onSettled} onFinished={onFinished} />);

      expect(screen.getByText(/could not answer/i)).toBeVisible();
      expect(screen.queryByText('Incomplete.')).not.toBeInTheDocument();
      expect(onFinished).toHaveBeenCalledOnce();
      expect(onSettled).not.toHaveBeenCalled();
    }
  );

  // A capped turn ends `length` and a dropped body ends with no reason at all.
  // Both settle as `ready` with no error and no onError, so nothing here is
  // readable from `error` or `status` — only the finish reason says the turn
  // stopped early. Until it was read, half an answer was saved and announced as
  // the finished brief.
  it.each([
    { label: 'a token cap', overrides: { finishReason: 'length' }, state: 'done' as const },
    {
      label: 'a content filter',
      overrides: { finishReason: 'content-filter' },
      state: 'done' as const,
    },
    { label: 'a disconnect', overrides: { isDisconnect: true }, state: 'done' as const },
    // No finish reason reports this one: the body just stops, and the only trace
    // is a text part that `text-end` never closed.
    { label: 'a body that just stops', overrides: {}, state: 'streaming' as const },
  ])('refuses a turn truncated by $label, with no error to read', ({ overrides, state }) => {
    const message = {
      id: '1',
      role: 'assistant' as const,
      parts: [{ type: 'text' as const, text: 'Half a sen', state }],
    };
    chat.state = { status: 'streaming', messages: [message] };
    const onSettled = vi.fn();
    const onFinished = vi.fn();

    render(<IntakeBrief question={QUESTION} onSettled={onSettled} onFinished={onFinished} />);
    act(() => finishTurn(message, overrides));

    expect(screen.getByText(/could not answer/i)).toBeVisible();
    expect(screen.queryByText('Half a sen')).not.toBeInTheDocument();
    expect(onSettled).not.toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledOnce();
  });

  it.each([
    { parts: [{ type: 'text', text: '   ' }] },
    { parts: [{ type: 'reasoning', text: 'Thinking.' }] },
  ])('fails a completed turn with no answer and releases the form', ({ parts }) => {
    chat.state = { status: 'submitted', messages: [] };
    const onFinished = vi.fn();
    const onSettled = vi.fn();

    const view = render(
      <IntakeBrief question={QUESTION} onFinished={onFinished} onSettled={onSettled} />
    );
    chat.state = {
      status: 'ready',
      messages: [{ id: '2', role: 'assistant', parts }],
    };

    act(() => finishTurn());
    view.rerender(
      <IntakeBrief question={QUESTION} onFinished={onFinished} onSettled={onSettled} />
    );

    expect(screen.getByText(/could not answer/i)).toBeVisible();
    expect(screen.queryByText(/reading the evidence/i)).not.toBeInTheDocument();
    expect(onFinished).toHaveBeenCalledOnce();
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('recovers when sending the question rejects', async () => {
    captured.send.mockRejectedValueOnce(new Error('network'));

    render(<IntakeBrief question={QUESTION} />);

    expect(await screen.findByText(/could not answer/i)).toBeVisible();
  });

  it.each([{ finishReason: 'stop' }, { finishReason: undefined }, { finishReason: 'other' }])(
    'keeps a whole answer when the finish reason is $finishReason',
    ({ finishReason }) => {
      // An absent reason is NOT a truncation: the chunk field is optional, so a
      // provider that never sends it would otherwise lose every answer.
      const message = {
        id: '1',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: 'A whole answer.', state: 'done' as const }],
      };
      chat.state = { status: 'streaming', messages: [message] };

      render(<IntakeBrief question={QUESTION} />);
      act(() => finishTurn(message, { finishReason }));

      expect(screen.queryByText(/could not answer/i)).not.toBeInTheDocument();
    }
  );
});
