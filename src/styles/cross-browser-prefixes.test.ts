import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// There is no autoprefixer, so Safari-sensitive properties need explicit partners.

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cssFiles = readdirSync(srcDir, { recursive: true, encoding: 'utf-8' })
  .filter((entry) => entry.endsWith('.css'))
  .map((entry) => path.join(srcDir, entry));

const PREFIX_PAIRS: ReadonlyArray<[standard: string, webkit: string]> = [
  ['backdrop-filter', '-webkit-backdrop-filter'],
  ['appearance', '-webkit-appearance'],
  ['user-select', '-webkit-user-select'],
];

function declarationBlocks(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutComments.match(/\{([^{}]*)\}/g) ?? [];
}

function hasStandardDecl(block: string, property: string): boolean {
  return block.split(';').some((declaration) => {
    const colon = declaration.indexOf(':');
    return colon >= 0 && declaration.slice(0, colon).trim() === property;
  });
}

describe('cross-browser vendor prefixes', () => {
  it('discovers CSS files to lint', () => {
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  describe.each(cssFiles)('%s', (file) => {
    const blocks = declarationBlocks(readFileSync(file, 'utf-8'));

    it.each(PREFIX_PAIRS)('pairs every `%s` with `%s`', (standard, webkit) => {
      const offenders = blocks.filter(
        (block) => hasStandardDecl(block, standard) && !block.includes(webkit)
      );
      expect(offenders).toEqual([]);
    });

    it('pairs `background-clip: text` with `-webkit-background-clip: text`', () => {
      const offenders = blocks.filter((block) => {
        const clipsText = /(?<!-webkit-)background-clip\s*:\s*text/.test(block);
        return clipsText && !/-webkit-background-clip\s*:\s*text/.test(block);
      });
      expect(offenders).toEqual([]);
    });

    it('pairs `backface-visibility: hidden` with an explicit `transform`', () => {
      const offenders = blocks.filter(
        (block) =>
          /(?<!-webkit-)backface-visibility\s*:\s*hidden/.test(block) &&
          !/(?<!-webkit-)transform\s*:/.test(block)
      );
      expect(offenders).toEqual([]);
    });
  });
});

describe('cross-browser @property inheritance', () => {
  it('declares spotlight coord properties as inherits: true', () => {
    const all = cssFiles.map((f) => readFileSync(f, 'utf-8')).join('\n');
    const rules = [...all.matchAll(/@property\s+(--spot-[xy])\s*\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    const offenders = rules
      .filter(([, , body]) => !/inherits\s*:\s*true/.test(body))
      .map(([, name]) => name);
    expect(offenders).toEqual([]);
  });
});
