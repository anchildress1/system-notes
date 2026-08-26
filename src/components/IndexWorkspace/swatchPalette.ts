/**
 * Lightness of the surface a swatch is drawn on, per theme, in percent.
 *
 * The same on both, because the board is the same dark plate on both — see
 * --board-plate. A light board would force every tone dark enough to survive
 * paper, and a tone dark enough to survive paper can never be gold.
 */
export const SWATCH_SURFACE_LIGHTNESS = { dark: 15.5, light: 15.5 } as const;

/**
 * How far a swatch must sit from the board's surface, in points of lightness.
 *
 * A swatch that lands near the surface scores about 1.1:1 against the board
 * and, worse, about 1.1:1 against its own dimmed state — so filtering that
 * category changes nothing a reader can see. 34.5 is the separation at which
 * every slot clears 3:1 against the board and 2.9:1 against its dimmed self.
 *
 * This is a distance rather than a floor so it survives the surface changing.
 * Both themes resolve it identically now, since both boards are the same plate,
 * but the arithmetic stays honest if that ever stops being true.
 */
export const SWATCH_MIN_LIGHTNESS_DELTA = 34.5;

export type SwatchTheme = keyof typeof SWATCH_SURFACE_LIGHTNESS;

/**
 * Tones a category's tiles and its filter swatch, indexed by the category's
 * rank by size. Slots separate by chroma as well as lightness: five purely
 * tonal steps cannot stay distinct at this separation.
 *
 * Three neutrals and an accent, not an arc of hues. The ranking is carried by
 * tone — the strongest mark the board can make, then a mid grey, then the
 * accent, then a dim grey — so the board reads as a census in ink with one
 * category picked out of it. On graphite that reads bone, grey, gold, dim; on
 * bone, grey, gold, dim — on both themes, because both boards are the same dark
 * plate. Gold cannot clear a LIGHT board without becoming mustard, so the board
 * stopped being light rather than the accent stopping being gold.
 *
 * Every entry is a token. A literal cannot follow a theme, so a hardcoded
 * color here renders identically against both boards.
 */
export const SWATCH_PALETTE = [
  'var(--k-decision)',
  'var(--k-note)',
  'var(--k-other)',
  'var(--k-principle)',
] as const;

/**
 * Reserved for the awards category and deliberately outside the rank palette.
 * While it was slot 0, whichever category happened to rank first took the same
 * tone as the awards, and two rows of the filing list painted identically.
 *
 * It resolves to the same pigment as the accent slot and does not collide with
 * it, because an award is not FILLED — it is a hollow ring, told apart by shape
 * rather than by tone. The ring is drawn in IndexWorkspace.module.css.
 */
export const AWARD_SWATCH = 'var(--k-award)';

/**
 * How an awards tile is told apart from the rank slot it shares a pigment with.
 *
 * A ring is separated by SHAPE, so it may resolve to the same tone as a rank
 * slot without the two painting identically — which is what lets the awards
 * carry the accent itself rather than a tone invented to avoid it. A fill has
 * no such licence and must hold a tone of its own.
 *
 * The ring is drawn in IndexWorkspace.module.css. Change this to 'fill' there
 * and the palette owes awards a distinct tone again; the test enforces it.
 */
export const AWARD_RENDERING: 'ring' | 'fill' = 'ring';

/**
 * Tokens a swatch may reference, with the lightness each resolves to per theme.
 * Referencing a token outside this map is what let a background-adjacent tone
 * onto the board, so the set is closed rather than advisory.
 *
 * --ink-accent is deliberately absent. It is the accent, and --k-decision is derived
 * from it, so the two sit close enough that a palette holding both would paint
 * two ranks all but identically while passing a uniqueness check on strings.
 */
export const SWATCH_TOKEN_LIGHTNESS: Readonly<
  Record<string, Readonly<Record<SwatchTheme, number>>>
> = {
  '--k-decision': { dark: 93, light: 93 },
  '--k-note': { dark: 68, light: 68 },
  '--k-other': { dark: 86, light: 86 },
  '--k-principle': { dark: 52, light: 52 },
  '--k-award': { dark: 86, light: 86 },
};

/**
 * Assigns every category its swatch, by rank among the categories that actually
 * draw from the rank palette.
 *
 * An award category takes {@link AWARD_SWATCH} and must NOT consume a rank slot.
 * While it did, five categories over a four-slot palette wrapped the last one
 * back onto slot 0: Principles and Decisions painted the same color on both
 * boards, which is indistinguishable from a filter that does nothing.
 *
 * @param values Category values in rank order, largest first.
 * @param isAward Names the categories that take the reserved award tone.
 * @returns Category value to swatch string, one entry per input value.
 */
export function assignSwatches(
  values: readonly string[],
  isAward: (value: string) => boolean
): Map<string, string> {
  let rank = 0;
  const assigned = new Map<string, string>();
  for (const value of values) {
    if (assigned.has(value)) continue;
    assigned.set(
      value,
      isAward(value) ? AWARD_SWATCH : SWATCH_PALETTE[rank++ % SWATCH_PALETTE.length]!
    );
  }
  return assigned;
}

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
    // near-black swatch as valid. Normalize rather than trust the caller.
    return literal[2] ? raw : raw * 100;
  }
  throw new Error(`Unrecognized swatch: ${swatch}`);
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
