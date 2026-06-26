import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// PostCSS in this repo runs ONLY @tailwindcss/postcss — there is no autoprefixer.
// So every Safari-sensitive property must ship its -webkit- partner by hand or
// the effect silently dies in Safari/iOS. This guard fails the build if anyone
// adds a bare declaration without its prefix.

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cssFiles = readdirSync(srcDir, { recursive: true, encoding: 'utf-8' })
  .filter((entry) => entry.endsWith('.css'))
  .map((entry) => path.join(srcDir, entry));

// Standard property -> the -webkit- partner that must accompany it in the
// same declaration block. background-clip is only prefix-sensitive when it
// clips to text, so it is handled separately below.
const PREFIX_PAIRS: ReadonlyArray<[standard: string, webkit: string]> = [
  ['backdrop-filter', '-webkit-backdrop-filter'],
  ['appearance', '-webkit-appearance'],
  ['user-select', '-webkit-user-select'],
];

// Strip comments, then match leaf declaration bodies — `{ ... }` blocks that
// contain no nested braces. This reaches rules nested inside @media too.
function declarationBlocks(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutComments.match(/\{([^{}]*)\}/g) ?? [];
}

// A standard property declaration that is NOT itself the -webkit- variant.
function hasStandardDecl(block: string, property: string): boolean {
  return new RegExp(`(?<!-webkit-)\\b${property}\\s*:`).test(block);
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

    // `-webkit-text-fill-color` is intentionally omitted here: it is a separate
    // concern that legitimately reaches an element via the cascade (a base rule),
    // so it cannot be required within every block that clips to text.
    it('pairs `background-clip: text` with `-webkit-background-clip: text`', () => {
      const offenders = blocks.filter((block) => {
        const clipsText = /(?<!-webkit-)background-clip\s*:\s*text/.test(block);
        return clipsText && !/-webkit-background-clip\s*:\s*text/.test(block);
      });
      expect(offenders).toEqual([]);
    });

    // Firefox only backface-culls an element that has its own transform; Chrome
    // culls regardless. A face with `backface-visibility: hidden` but no
    // transform shows mirrored through the flipped card in Firefox. Both faces
    // must carry an explicit transform (the front an identity rotateY(0deg)).
    it('pairs `backface-visibility: hidden` with an explicit `transform`', () => {
      // Lookbehind keeps this focused on the standard properties (not their
      // -webkit- variants), and matches a `transform:` anywhere in the block.
      const offenders = blocks.filter(
        (block) =>
          /(?<!-webkit-)backface-visibility\s*:\s*hidden/.test(block) &&
          !/(?<!-webkit-)transform\s*:/.test(block)
      );
      expect(offenders).toEqual([]);
    });
  });
});

// The cursor spotlight writes --spot-x/--spot-y onto .hero but the gradient
// lives on .hero::after. A registered custom property only reaches the pseudo
// when it inherits; Firefox honors `inherits: false` strictly (glow stays at
// the -1000px initial value, invisible), Chrome leniently propagates it.
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
