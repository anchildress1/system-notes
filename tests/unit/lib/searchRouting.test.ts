import { describe, expect, it } from 'vitest';
import {
  createSearchRouting,
  getProjectNotesURL,
  toRouteState,
  toUiState,
} from '@/lib/searchRouting';

const indexName = 'notes';

describe('search routing', () => {
  it('maps InstantSearch state to the compact public route', () => {
    expect(
      toRouteState(
        {
          [indexName]: {
            query: 'failure',
            refinementList: {
              category: ['Principle'],
              projects: ['System Notes'],
              'tags.lvl0': ['Testing'],
            },
          },
        },
        indexName
      )
    ).toEqual({
      q: 'failure',
      kind: 'Principle',
      project: 'System Notes',
      tag: 'Testing',
    });
  });

  it('keeps multiple refinements as arrays', () => {
    expect(
      toRouteState(
        {
          [indexName]: {
            refinementList: { projects: ['System Notes', 'Commit Chronicles'] },
          },
        },
        indexName
      ).project
    ).toEqual(['System Notes', 'Commit Chronicles']);
  });

  it('omits empty search state', () => {
    expect(toRouteState({}, indexName)).toEqual({
      q: undefined,
      kind: undefined,
      project: undefined,
      tag: undefined,
    });
  });

  it('accepts scalar and array query parameters while removing blanks', () => {
    expect(
      toUiState(
        {
          q: '  reliability  ',
          kind: 'Principle',
          project: ['System Notes', ' '],
          tag: ['Testing'],
        },
        indexName
      )
    ).toEqual({
      [indexName]: {
        query: 'reliability',
        refinementList: {
          category: ['Principle'],
          projects: ['System Notes'],
          'tags.lvl0': ['Testing'],
        },
      },
    });
  });

  it('normalizes repeated scalars and rejects structured route values', () => {
    expect(
      toUiState(
        {
          q: ['first', 'second'],
          kind: { 0: 'Principle' },
          project: ['System Notes', 42, ''],
        },
        indexName
      )
    ).toEqual({
      [indexName]: {
        query: 'first',
        refinementList: { projects: ['System Notes'] },
      },
    });
  });

  it('creates a history router and matching state mapper', () => {
    const routing = createSearchRouting(indexName);

    expect(routing.router).toHaveProperty('read');
    expect(routing.stateMapping.routeToState({ project: 'System Notes' })).toEqual({
      [indexName]: {
        query: undefined,
        refinementList: { projects: ['System Notes'] },
      },
    });
  });

  it('builds project cross-links and rejects blank titles', () => {
    expect(getProjectNotesURL(' Commit Chronicles ')).toBe(
      '/?project=Commit+Chronicles#notes-index'
    );
    expect(getProjectNotesURL(' ')).toBe('/#notes-index');
  });
});
