import { describe, expect, it } from 'vitest';
import {
  formatNoteDate,
  getFactHitPosition,
  getNoteBody,
  getNoteProjects,
  getNoteTags,
  isValidNoteId,
  normalizeFactHitRecord,
  normalizeFactSearchHit,
} from './noteContent';

describe('note content helpers', () => {
  it.each([
    ['card:system-notes:0001', true],
    ['note_with-dashes', true],
    ['', false],
    ['contains spaces', false],
    ['../escape', false],
    ['a'.repeat(201), false],
  ])('validates note id %j as %s', (value, expected) => {
    expect(isValidNoteId(value)).toBe(expected);
  });

  it.each([
    [{ content: ' full ', fact: 'fact', blurb: 'blurb' }, 'full'],
    [{ content: ' ', fact: ' fact ', blurb: 'blurb' }, 'fact'],
    [{ content: undefined, fact: '', blurb: ' blurb ' }, 'blurb'],
    [{ content: undefined, fact: '', blurb: '' }, 'No detail available.'],
  ])('chooses the first useful note body', (note, expected) => {
    expect(getNoteBody(note)).toBe(expected);
  });

  it('uses nested leaf tags, removes hierarchy, and deduplicates values', () => {
    expect(
      getNoteTags({
        'tags.lvl0': ['Engineering'],
        'tags.lvl1': ['Engineering > TypeScript', 'Engineering > TypeScript', 'Plain'],
      })
    ).toEqual(['TypeScript', 'Plain']);
  });

  it('falls back to top-level tags and removes blank values', () => {
    expect(getNoteTags({ 'tags.lvl0': ['Engineering', ' ', 'Testing'] })).toEqual([
      'Engineering',
      'Testing',
    ]);
    expect(getNoteTags({})).toEqual([]);
  });

  it('treats malformed note fields as absent', () => {
    expect(getNoteBody({ content: 42, fact: {}, blurb: ['wrong'] })).toBe('No detail available.');
    expect(getNoteTags({ 'tags.lvl0': 'wrong', 'tags.lvl1': [1, 'Topic'] })).toEqual(['Topic']);
    expect(getNoteProjects({ projects: ['System Notes', 42, ' ', 'System Notes'] })).toEqual([
      'System Notes',
    ]);
  });

  it('normalizes remote hits at the search boundary', () => {
    expect(
      normalizeFactHitRecord({
        objectID: ' card:test:1 ',
        title: ' Title ',
        blurb: 42,
        fact: ' Fact ',
        projects: 'wrong',
        category: {},
        'tags.lvl0': [1, ' Testing '],
      })
    ).toMatchObject({
      objectID: 'card:test:1',
      title: 'Title',
      blurb: '',
      fact: 'Fact',
      projects: [],
      category: 'Note',
      'tags.lvl0': ['Testing'],
    });
    expect(normalizeFactHitRecord({ objectID: 'card:test:1', title: 42 })).toBeNull();
    expect(normalizeFactHitRecord({ objectID: '../escape', title: 'Title' })).toBeNull();
    expect(normalizeFactHitRecord({ objectID: 'a'.repeat(201), title: 'Title' })).toBeNull();
  });

  it('preserves Algolia hit metadata while normalizing display fields', () => {
    const hit = normalizeFactSearchHit({
      objectID: 'card:test:1',
      title: ' Title ',
      __position: 19,
      __queryID: 'query-id',
      _highlightResult: { title: { value: 42 } },
    });

    expect(hit).toMatchObject({
      objectID: 'card:test:1',
      title: 'Title',
      __position: 19,
      __queryID: 'query-id',
    });
    expect(hit).not.toHaveProperty('_highlightResult');
  });

  it('uses Algolia absolute positions and a safe local fallback', () => {
    expect(getFactHitPosition({ __position: 19 }, 1)).toBe(19);
    expect(getFactHitPosition({ __position: 0 }, 3)).toBe(3);
    expect(getFactHitPosition({ __position: Number.NaN }, 4)).toBe(4);
  });

  it.each([
    ['2026-05-24T21:42:51Z', 'May 2026'],
    [undefined, null],
    ['not-a-date', null],
    ['2026-13-01', null],
  ])('formats note date %j', (value, expected) => {
    expect(formatNoteDate(value)).toBe(expected);
  });
});
