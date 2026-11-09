/** The highlighters a reader can pick, in fan order. The first is the site's own. */
export const PENS = ['yellow', 'blue', 'green', 'pink'] as const;

/** One highlighter, and the value stamped on `<html>` as `data-pen`. */
export type Pen = (typeof PENS)[number];

/** Where the reader's pick is kept between visits. */
export const PEN_STORAGE_KEY = 'system-notes-pen';

/** What the server renders, and what a reader without a stored pick falls back to. */
export const DEFAULT_PEN: Pen = 'yellow';

/**
 * Narrows an unknown stored value to a pen.
 *
 * @param value Anything read out of storage or an attribute.
 * @returns The pen, or null when the value is not one of the four literals.
 */
export function parsePen(value: unknown): Pen | null {
  return PENS.find((pen) => pen === value) ?? null;
}

/* Stamps the stored pen onto `<html>` before the first paint, so a reader who
   picked blue never sees a gold frame first. Same constraints as THEME_SCRIPT:
   it must not throw, and it touches one attribute of `<html>`. The default pen
   is the absence of the attribute, which is what the server renders. */
export const PEN_SCRIPT = `(function(){try{
var p=localStorage.getItem(${JSON.stringify(PEN_STORAGE_KEY)});
if(${JSON.stringify(PENS.filter((pen) => pen !== DEFAULT_PEN))}.indexOf(p)!==-1)document.documentElement.setAttribute('data-pen',p);
}catch(e){}})();`;
