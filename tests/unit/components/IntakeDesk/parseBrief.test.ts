import { describe, expect, it } from 'vitest';
import { parseBrief } from '@/components/IntakeDesk/BriefBody';

describe('parseBrief', () => {
  it('returns prose untouched when it carries no citation', () => {
    expect(parseBrief('I have shipped that.')).toEqual([{ text: 'I have shipped that.' }]);
  });

  it('resolves a citation into a followable link', () => {
    expect(parseBrief('See [Forged Between Coal and Code](https://dev.to/a/b) for it.')).toEqual([
      { text: 'See ' },
      { text: 'Forged Between Coal and Code', href: 'https://dev.to/a/b' },
      { text: ' for it.' },
    ]);
  });

  it('keeps several citations in the order they were written', () => {
    const segments = parseBrief('[One](https://a.example) and [Two](https://b.example)');

    expect(segments.map((segment) => segment.text)).toEqual(['One', ' and ', 'Two']);
    expect(segments.filter((segment) => segment.href)).toHaveLength(2);
  });

  it('keeps the words and drops the link when the url is not safe to follow', () => {
    // Model output is shaped partly by indexed content, so a url in it is
    // untrusted. The citation still reads; it just stops being clickable.
    for (const href of ['javascript:alert(1)', 'http://example.com', 'data:text/html,x']) {
      const [segment] = parseBrief(`[Click](${href})`);
      expect(segment, href).toEqual({ text: 'Click' });
    }
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
    const segments = parseBrief('<img src=x onerror=alert(1)> and [ok](https://a.example)');

    expect(segments[0]).toEqual({ text: '<img src=x onerror=alert(1)> and ' });
    expect(segments.every((segment) => typeof segment.text === 'string')).toBe(true);
  });

  it('handles an empty paragraph', () => {
    expect(parseBrief('')).toEqual([]);
  });
});
