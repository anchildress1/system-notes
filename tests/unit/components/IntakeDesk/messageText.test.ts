import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'instantsearch.js/es/lib/ai-lite';
import { messageText } from '@/components/IntakeDesk/IntakeBrief';

const message = (parts: UIMessage['parts']): UIMessage => ({
  id: 'm1',
  role: 'assistant',
  parts,
});

describe('messageText', () => {
  it('reads the text of a turn', () => {
    expect(messageText(message([{ type: 'text', text: 'The brief.' }]))).toBe('The brief.');
  });

  it('joins split text parts in order', () => {
    // A streamed turn arrives in fragments; the answer is their concatenation,
    // not the first one that showed up.
    expect(
      messageText(
        message([
          { type: 'text', text: 'I have shipped ' },
          { type: 'text', text: 'the guardrails.' },
        ])
      )
    ).toBe('I have shipped the guardrails.');
  });

  it('drops everything that is not the answer', () => {
    // Reasoning and tool calls describe how the turn was arrived at. Rendering
    // them would put the agent's working out in front of the reader.
    const mixed = message([
      { type: 'reasoning', text: 'Thinking about it.' },
      { type: 'text', text: 'The answer.' },
      { type: 'step-start' },
    ] as UIMessage['parts']);

    expect(messageText(mixed)).toBe('The answer.');
  });

  it('returns nothing for a turn that carried no text', () => {
    expect(messageText(message([{ type: 'reasoning', text: 'Only thinking.' }]))).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(messageText(message([{ type: 'text', text: '\n  Spaced.  \n' }]))).toBe('Spaced.');
  });

  it('handles no message at all', () => {
    expect(messageText(undefined)).toBe('');
  });
});
