import { describe, expect, it } from 'vitest';
import { parseBrief, parseBriefStructure } from '@/components/IntakeDesk/BriefBody';

describe('parseBrief', () => {
  it('returns prose untouched when it carries no citation', () => {
    expect(parseBrief('I have shipped that.')).toEqual([{ text: 'I have shipped that.' }]);
  });

  it('resolves a citation into a followable link', () => {
    const href = 'https://dev.to/anchildress1/forged-between-coal-and-code-abc';

    expect(parseBrief(`See [Forged Between Coal and Code](${href}) for it.`)).toEqual([
      { text: 'See ' },
      { text: 'Forged Between Coal and Code', href },
      { text: ' for it.' },
    ]);
  });

  it('keeps several citations in the order they were written', () => {
    const segments = parseBrief(
      '[One](https://dev.to/anchildress1/one) and [Two](https://anchildress1.dev/projects?system=vestige)'
    );

    expect(segments.map((segment) => segment.text)).toEqual(['One', ' and ', 'Two']);
    expect(segments.filter((segment) => segment.href)).toHaveLength(2);
  });

  it.each(['javascript:alert(1)', 'http://example.com', 'data:text/html,x'])(
    'keeps the words and drops the unsafe url %s',
    (href) => {
      // Model output is shaped partly by indexed content, so a url in it is
      // untrusted. The citation still reads; it just stops being clickable.
      const [segment] = parseBrief(`[Click](${href})`);
      expect(segment).toEqual({ text: 'Click' });
    }
  );

  it.each([
    'https://example.com/phishing',
    'https://dev.to/someone-else/copied-title',
    'https://anchildress1.dev/about',
  ])('drops a safe-looking url outside the published evidence: %s', (href) => {
    expect(parseBrief(`[Claim](${href})`)).toEqual([{ text: 'Claim' }]);
  });

  it.each([
    'https://anchildress1.dev/projects?system=ghost-system',
    'https://anchildress1.dev/projects',
    'https://anchildress1.dev/projects?system=vestige&next=https://example.com',
  ])('drops a malformed project citation: %s', (href) => {
    expect(parseBrief(`[Claim](${href})`)).toEqual([{ text: 'Claim' }]);
  });

  it('drops credentials embedded in a url', () => {
    expect(parseBrief('[x](https://user:pass@example.com)')).toEqual([{ text: 'x' }]);
  });

  it('leaves a bare url alone rather than guessing at a citation', () => {
    expect(parseBrief('See https://dev.to/a/b')).toEqual([{ text: 'See https://dev.to/a/b' }]);
  });

  it('leaves unmatched brackets as the characters they are', () => {
    expect(parseBrief('An [unclosed citation and (parens)')).toEqual([
      { text: 'An [unclosed citation and (parens)' },
    ]);
  });

  it('never yields markup, whatever the answer contains', () => {
    // The whole reason this is parsed rather than injected.
    const segments = parseBrief(
      '<img src=x onerror=alert(1)> and [ok](https://dev.to/anchildress1/ok)'
    );

    expect(segments[0]).toEqual({ text: '<img src=x onerror=alert(1)> and ' });
    expect(segments.every((segment) => typeof segment.text === 'string')).toBe(true);
  });

  it('handles an empty paragraph', () => {
    expect(parseBrief('')).toEqual([]);
  });
});

describe('parseBriefStructure', () => {
  const LEAD = 'I have shipped attribution controls, but not a complete ledger.';

  it('reads the opening paragraph as the lead', () => {
    const blocks = parseBriefStructure(`${LEAD}\n\nSomething else entirely.`);

    expect(blocks[0]).toEqual({ kind: 'lead', text: LEAD });
  });

  it('numbers signposted steps by position and lifts the ordinal out of the prose', () => {
    const blocks = parseBriefStructure(
      [LEAD, 'First, I would define each action.', 'Next, I would scope approval.'].join('\n\n')
    );

    expect(blocks[1]).toEqual({ kind: 'step', ordinal: 1, text: 'I would define each action.' });
    expect(blocks[2]).toEqual({ kind: 'step', ordinal: 2, text: 'I would scope approval.' });
  });

  it('numbers by position, so a repeated signpost cannot desync the count', () => {
    const blocks = parseBriefStructure(
      [LEAD, 'Then, I would do one thing.', 'Then, I would do another.'].join('\n\n')
    );

    expect(blocks.map((b) => (b.kind === 'step' ? b.ordinal : null))).toEqual([null, 1, 2]);
  });

  it('marks the register shift into what the answer refuses', () => {
    const counter = 'I would not treat a chat transcript as an authorization record.';
    const blocks = parseBriefStructure(`${LEAD}\n\n${counter}`);

    expect(blocks[1]).toEqual({ kind: 'counter', text: counter });
  });

  it('ignores an ordinal that merely starts a sentence', () => {
    // "Second point." is a sentence that opens with an ordinal, not a step in a
    // sequence. Treating it as one swallowed the word and rendered "point."
    const blocks = parseBriefStructure([LEAD, 'Second point.', 'Third point.'].join('\n\n'));

    expect(blocks.map((b) => b.kind)).toEqual(['lead', 'body', 'body']);
    expect(blocks[1]).toEqual({ kind: 'body', text: 'Second point.' });
  });

  it('accepts a signpost that runs straight into the first person', () => {
    const blocks = parseBriefStructure(
      [LEAD, 'Then I would ship it.', 'Next I would measure it.'].join('\n\n')
    );

    expect(blocks[1]).toEqual({ kind: 'step', ordinal: 1, text: 'I would ship it.' });
    expect(blocks[2]).toEqual({ kind: 'step', ordinal: 2, text: 'I would measure it.' });
  });

  it('leaves a lone signpost as prose rather than numbering a sequence of one', () => {
    // One "Finally," in an otherwise unstructured answer is a turn of phrase.
    const blocks = parseBriefStructure(`${LEAD}\n\nFinally, I would ship it.`);

    expect(blocks[1]!.kind).toBe('body');
    expect(blocks[1]).toEqual({ kind: 'body', text: 'Finally, I would ship it.' });
  });

  it('renders an unstructured answer exactly as prose', () => {
    const blocks = parseBriefStructure(`${LEAD}\n\nA plain paragraph.\n\nAnother one.`);

    expect(blocks.map((b) => b.kind)).toEqual(['lead', 'body', 'body']);
  });

  it('drops blank paragraphs and stray whitespace between blocks', () => {
    const blocks = parseBriefStructure(`${LEAD}\n\n\n\n   \n\nA real paragraph.`);

    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toEqual({ kind: 'body', text: 'A real paragraph.' });
  });

  it('returns nothing for an empty answer', () => {
    expect(parseBriefStructure('')).toEqual([]);
  });
});
