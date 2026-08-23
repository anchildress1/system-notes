/** Lightness of the surface a swatch is drawn on, per theme, in percent. */
export const SWATCH_SURFACE_LIGHTNESS = { dark: 15.5, light: 97.2 } as const;

/**
 * How far a swatch must sit from the board's surface, in points of lightness.
 *
 * A swatch that lands near the surface scores about 1.1:1 against the board
 * and, worse, about 1.1:1 against its own dimmed state — so filtering that
 * category changes nothing a reader can see. 34.5 is the separation at which
 * every slot clears 3:1 against the board and 2.9:1 against its dimmed self.
 *
 * This is a distance, not a floor. The original 50 was a floor derived from a
 * dark board alone (50 - 15.5), and it inverts under a light one, where a
 * swatch has to be *darker* than the surface rather than lighter.
 */
export const SWATCH_MIN_LIGHTNESS_DELTA = 34.5;

export type SwatchTheme = keyof typeof SWATCH_SURFACE_LIGHTNESS;

/**
 * Tones a category's tiles and its filter swatch, indexed by the category's
 * rank by size. Slots separate by chroma as well as lightness: five purely
 * tonal steps cannot stay distinct at this separation.
 *
 * Every entry is a token. A literal cannot follow a theme, so a hardcoded
 * colour here renders identically against both boards.
 */
export const SWATCH_PALETTE = [
  'var(--k-award)',
  'var(--k-decision)',
  'var(--k-principle)',
  'var(--k-note)',
  'var(--k-other)',
] as const;

/**
 * Tokens a swatch may reference, with the lightness each resolves to per theme.
 * Referencing a token outside this map is what let a background-adjacent tone
 * onto the board, so the set is closed rather than advisory.
 *
 * --flag is deliberately absent: it is byte-identical to --k-decision in dark,
 * so a palette holding both would pass a uniqueness check on strings while
 * painting two ranks the same colour.
 */
export const SWATCH_TOKEN_LIGHTNESS: Readonly<
  Record<string, Readonly<Record<SwatchTheme, number>>>
> = {
  '--k-award': { dark: 93, light: 62 },
  '--k-decision': { dark: 83, light: 58 },
  '--k-other': { dark: 78, light: 40 },
  '--k-principle': { dark: 72, light: 52 },
  '--k-note': { dark: 66, light: 46 },
};

/**
 * Resolves a palette entry to its lightness in percent.
 *
 * @param swatch A palette entry: either `var(--token)` or a literal `oklch()`.
 * @param theme Which board the swatch will be drawn on.
 * @returns The lightness in percent, 0-100.
 * @throws If the entry is neither form, or names a token outside
 *   `SWATCH_TOKEN_LIGHTNESS` — both mean an unreviewed tone reached the board.
 */
export function swatchLightness(swatch: string, theme: SwatchTheme = 'dark'): number {
  const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(swatch);
  if (token) {
    const lightness = SWATCH_TOKEN_LIGHTNESS[token[1]!];
    if (lightness === undefined) throw new Error(`Unreviewed swatch token: ${token[1]}`);
    return lightness[theme];
  }
  const literal = /^oklch\(\s*([\d.]+)(%?)/.exec(swatch);
  if (literal) {
    const raw = Number.parseFloat(literal[1]!);
    // oklch takes lightness as either 0-100 with a percent sign or 0-1 without.
    // Reading the unitless form as-is scores oklch(0.83 ...) at a lightness of
    // 0.83, which clears no floor and trips no error — it just quietly reports a
    // near-black swatch as valid. Normalise rather than trust the caller.
    return literal[2] ? raw : raw * 100;
  }
  throw new Error(`Unrecognised swatch: ${swatch}`);
}

/**
 * Whether a swatch sits far enough from the board to be readable on it.
 *
 * @param swatch A palette entry.
 * @param theme Which board the swatch will be drawn on.
 * @returns True when the separation meets {@link SWATCH_MIN_LIGHTNESS_DELTA}.
 */
export function swatchClearsSurface(swatch: string, theme: SwatchTheme): boolean {
  // Absolute distance rather than a comparison: the swatch must be lighter than
  // a dark board and darker than a light one, and only one of those is reachable
  // from either surface, so direction never has to be stated.
  return (
    Math.abs(swatchLightness(swatch, theme) - SWATCH_SURFACE_LIGHTNESS[theme]) >=
    SWATCH_MIN_LIGHTNESS_DELTA
  );
}
