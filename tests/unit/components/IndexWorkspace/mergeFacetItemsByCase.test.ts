import { describe, expect, it } from 'vitest';
import { mergeFacetItemsByCase } from '@/components/IndexWorkspace/IndexSearch';

const item = (value: string, count: number, isRefined = false) => ({
  value,
  label: value,
  count,
  isRefined,
});

describe('mergeFacetItemsByCase', () => {
  it('leaves distinct values alone', () => {
    const items = [item('Alpha', 3), item('Beta', 1)];

    expect(mergeFacetItemsByCase(items)).toEqual(items);
  });

  it('collapses a case variant into one entry', () => {
    // Algolia filters facets case-insensitively, so these are one filter to the
    // engine and were two checkboxes to the reader.
    const merged = mergeFacetItemsByCase([item('System Notes', 0, true), item('System notes', 42)]);

    expect(merged).toHaveLength(1);
    expect(merged[0]!.isRefined).toBe(true);
    expect(merged[0]!.count).toBe(42);
  });

  it('keeps the refined spelling as the value it will refine on', () => {
    // refine() has to toggle the refinement that exists. Handing it the other
    // spelling adds a second refinement instead of removing the first.
    const merged = mergeFacetItemsByCase([item('System notes', 42), item('System Notes', 0, true)]);

    expect(merged[0]!.value).toBe('System Notes');
  });

  it('shows the label of the entry Algolia actually counted', () => {
    const merged = mergeFacetItemsByCase([item('System Notes', 0, true), item('System notes', 42)]);

    expect(merged[0]!.label).toBe('System notes');
  });

  it('takes the higher count whichever order they arrive in', () => {
    expect(mergeFacetItemsByCase([item('a', 2), item('A', 9)])[0]!.count).toBe(9);
    expect(mergeFacetItemsByCase([item('A', 9), item('a', 2)])[0]!.count).toBe(9);
  });

  it('leaves an unrefined pair unrefined', () => {
    const merged = mergeFacetItemsByCase([item('a', 2), item('A', 9)]);

    expect(merged).toHaveLength(1);
    expect(merged[0]!.isRefined).toBe(false);
  });

  it('handles an empty list', () => {
    expect(mergeFacetItemsByCase([])).toEqual([]);
  });
});
