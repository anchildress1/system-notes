import { describe, it, expect } from 'vitest';
import { humanizeAttribute } from '../humanize';

describe('humanizeAttribute', () => {
  it('strips hierarchical lvl suffixes', () => {
    expect(humanizeAttribute('tags.lvl0')).toBe('tag');
    expect(humanizeAttribute('categories.lvl2')).toBe('category');
  });

  it('singularizes plural attributes', () => {
    expect(humanizeAttribute('projects')).toBe('project');
    expect(humanizeAttribute('boxes')).toBe('box');
    expect(humanizeAttribute('categories')).toBe('category');
    expect(humanizeAttribute('matches')).toBe('match');
  });

  it('lowercases and splits camelCase / snake_case', () => {
    expect(humanizeAttribute('productType')).toBe('product type');
    expect(humanizeAttribute('product_type')).toBe('product type');
    expect(humanizeAttribute('product-type')).toBe('product type');
  });

  it('leaves singular non-plural words untouched', () => {
    expect(humanizeAttribute('category')).toBe('category');
    expect(humanizeAttribute('kind')).toBe('kind');
  });

  it('does not chop double-s endings (class, address)', () => {
    expect(humanizeAttribute('class')).toBe('class');
    expect(humanizeAttribute('address')).toBe('address');
  });
});
