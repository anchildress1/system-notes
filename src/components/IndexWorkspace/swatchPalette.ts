/**
 * Lightness a board swatch must clear, in percent.
 *
 * The board's own surface sits at 15.5% lightness. A swatch that lands near it
 * scores about 1.1:1 against the board and, worse, about 1.1:1 against its own
 * dimmed state — so filtering that category changes nothing a reader can see.
 * 50% is the floor at which every slot clears 3:1 against the board and 2.9:1
 * against its dimmed self.
 */
export const SWATCH_LIGHTNESS_FLOOR = 50;

/**
 * Tones a category's tiles and its filter swatch, indexed by the category's
 * rank by size. Slots separate by chroma as well as lightness: five purely
 * tonal steps cannot stay distinct above the floor.
 */
export const SWATCH_PALETTE = [
  'var(--neon)',
  'var(--paper)',
  'oklch(74% 0.055 330)',
  'oklch(60% 0.02 330)',
  'oklch(50% 0.06 330)',
] as const;

/**
 * Tokens a swatch may reference, with the lightness each one resolves to.
 * Referencing a token outside this map is what let a background-adjacent tone
 * onto the board, so the set is closed rather than advisory.
 */
export const SWATCH_TOKEN_LIGHTNESS: Readonly<Record<string, number>> = {
  '--neon': 72,
  '--paper': 95,
};

/**
 * Resolves a palette entry to its lightness in percent.
 *
 * @param swatch A palette entry: either `var(--token)` or a literal `oklch()`.
 * @returns The lightness in percent.
 * @throws If the entry is neither form, or names a token outside
 *   `SWATCH_TOKEN_LIGHTNESS` — both mean an unreviewed tone reached the board.
 */
export function swatchLightness(swatch: string): number {
  const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(swatch);
  if (token) {
    const lightness = SWATCH_TOKEN_LIGHTNESS[token[1]!];
    if (lightness === undefined) throw new Error(`Unreviewed swatch token: ${token[1]}`);
    return lightness;
  }
  const literal = /^oklch\(\s*([\d.]+)%/.exec(swatch);
  if (literal) return Number.parseFloat(literal[1]!);
  throw new Error(`Unrecognised swatch: ${swatch}`);
}
