import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PEN, parsePen, PEN_SCRIPT, PEN_STORAGE_KEY, PENS } from '@/lib/pen';

describe('parsePen', () => {
  it('accepts every pen literal', () => {
    for (const pen of PENS) expect(parsePen(pen)).toBe(pen);
  });

  it('rejects anything a corrupted or stale store could hold', () => {
    for (const value of [null, undefined, '', 'Yellow', 'gold', 'red', 0, {}, []]) {
      expect(parsePen(value), String(value)).toBeNull();
    }
  });
});

describe('PEN_SCRIPT', () => {
  function run(getItem: () => string | null) {
    const setAttribute = vi.fn();
    runInNewContext(PEN_SCRIPT, {
      localStorage: { getItem },
      document: { documentElement: { setAttribute } },
    });
    return setAttribute;
  }

  it('cannot throw out of a blocking head script', () => {
    expect(PEN_SCRIPT).toMatch(/^\(function\(\)\{try\{/);
    expect(PEN_SCRIPT).toMatch(/\}catch\(e\)\{\}\}\)\(\);$/);
    expect(() =>
      run(() => {
        throw new Error('SecurityError');
      })
    ).not.toThrow();
  });

  it('reads the pen from its own storage key', () => {
    const getItem = vi.fn(() => null);
    run(getItem);
    expect(getItem).toHaveBeenCalledWith(PEN_STORAGE_KEY);
  });

  it.each(PENS.filter((pen) => pen !== DEFAULT_PEN))('stamps a stored %s pen', (pen) => {
    expect(run(() => pen)).toHaveBeenCalledWith('data-pen', pen);
  });

  it.each([DEFAULT_PEN, null, 'red', '<script>'])(
    'leaves the attribute off for stored %s, which is what the server renders',
    (stored) => {
      expect(run(() => stored)).not.toHaveBeenCalled();
    }
  );
});
