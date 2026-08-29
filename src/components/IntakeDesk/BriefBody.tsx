'use client';

import { citesKnownSystem } from '@/lib/systemIds';
import { isSafeExternalUrl } from '@/lib/urlSafety';
import styles from './IntakeDesk.module.css';

/** One inline citation the agent wrote, or a run of plain prose. */
export type BriefSegment = { text: string; href?: string };

const LINK = /\[([^[\]\n]+)\]\(([^\s)]+)\)/g;
const SITE_ORIGIN = 'https://anchildress1.dev';
const DEV_ORIGIN = 'https://dev.to';

/** Whether a model-written citation points at evidence this site publishes. */
function isAllowedCitationUrl(href: string): boolean {
  if (!isSafeExternalUrl(href)) return false;

  const url = new URL(href);
  if (url.origin === DEV_ORIGIN) {
    const path = url.pathname.split('/').filter(Boolean);
    return path.length === 2 && path[0] === 'anchildress1' && !url.search && !url.hash;
  }

  return (
    url.origin === SITE_ORIGIN &&
    url.pathname.replace(/\/$/, '') === '/projects' &&
    url.searchParams.size === 1 &&
    url.searchParams.has('system') &&
    !url.hash &&
    citesKnownSystem(href)
  );
}

/* Splits an answer into prose and the links written into it.

   Parsed rather than injected: the answer is model output shaped partly by indexed
   content, so it is untrusted, and dangerouslySetInnerHTML would make any tag it
   emitted executable. Parsing yields React elements, which cannot become markup.

   @param text One paragraph of the answer.
   @returns Segments in order; `href` is present only on links safe to follow. */
export function parseBrief(text: string): BriefSegment[] {
  const segments: BriefSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    // A citation outside the published evidence loses its link and keeps its
    // words: model output is untrusted even when it happens to be valid HTTPS.
    const followable = isAllowedCitationUrl(href);
    segments.push(followable ? { text: label!, href } : { text: label! });
    cursor = start + whole.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** One block of the answer, tagged with the role it plays in the argument. */
export type BriefBlock =
  | { kind: 'lead'; text: string }
  | { kind: 'step'; ordinal: number; text: string }
  | { kind: 'counter'; text: string }
  | { kind: 'body'; text: string };

/**
 * Signposts the agent opens a step with.
 *
 * The ordinal alone is not enough: a paragraph may legitimately begin "Second
 * point." without being a step in a sequence, and matching it swallowed the word
 * and rendered the remainder as "point.". A real signpost is punctuated
 * ("First, I would…") or runs straight into the first person ("Then I would…"),
 * which is how the agent actually writes them.
 */
const STEP_OPENER =
  /^(first|second|third|fourth|fifth|next|then|finally|lastly)\b(?:[,:]\s+|\s+(?=I\s))/i;

/** The register shift into what the answer is arguing against. */
const COUNTER_OPENER = /^i would not\b/i;

/** A step run shorter than this is coincidence, not a sequence worth numbering. */
const MIN_STEPS = 2;

/* Reads the shape of an answer so it can be set as an argument rather than a wall
   of identical paragraphs. The structure is not invented — the agent reliably opens
   with what is and is not already built, then walks the steps. */
export function parseBriefStructure(answer: string): BriefBlock[] {
  const paragraphs = answer
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  // The lead is never a step, so it never counts toward whether a sequence
  // exists — otherwise an opening "First, …" could conjure a run of one.
  const stepCount = paragraphs.slice(1).filter((p) => STEP_OPENER.test(p)).length;
  const numbered = stepCount >= MIN_STEPS;

  let ordinal = 0;
  return paragraphs.map((text, index) => {
    if (index === 0) return { kind: 'lead', text } as const;
    if (numbered && STEP_OPENER.test(text)) {
      ordinal += 1;
      return { kind: 'step', ordinal, text: text.replace(STEP_OPENER, '') } as const;
    }
    if (COUNTER_OPENER.test(text)) return { kind: 'counter', text } as const;
    return { kind: 'body', text } as const;
  });
}

/** The settled brief. Renders identically whether it just arrived or was restored. */
export default function BriefBody({
  question,
  answer,
}: Readonly<{ question: string; answer: string }>) {
  // Keyed on where the segment starts in the paragraph rather than on its place
  // in the array. Segments tile the source, so the offset is unique, and it does
  // not shift when an earlier one is split by a citation.
  const inline = (text: string) => {
    let at = 0;
    return parseBrief(text).map((segment) => {
      const key = at;
      at += segment.text.length;
      return segment.href ? (
        <a
          key={key}
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.briefLink}
        >
          {segment.text}
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      ) : (
        <span key={key}>{segment.text}</span>
      );
    });
  };

  return (
    <section className={styles.brief} aria-label="The brief">
      <p className={styles.briefQuestion}>{question}</p>
      {/* Placed above the answer, not under it: a disclosure a reader meets after they
   have already believed something is a footnote, not a disclosure. */}
      <p className={styles.briefCredit}>An AI agent wrote this from evidence I&rsquo;ve filed.</p>
      {parseBriefStructure(answer).map((block) => {
        if (block.kind === 'lead') {
          return (
            <p key={block.text} className={styles.briefLead}>
              {inline(block.text)}
            </p>
          );
        }
        if (block.kind === 'step') {
          return (
            <p key={block.text} className={styles.briefStep}>
              <span className={styles.briefStepMark} aria-hidden="true">
                {String(block.ordinal).padStart(2, '0')}
              </span>
              <span>{inline(block.text)}</span>
            </p>
          );
        }
        if (block.kind === 'counter') {
          return (
            <p key={block.text} className={styles.briefCounter}>
              {inline(block.text)}
            </p>
          );
        }
        return (
          <p key={block.text} className={styles.briefBody}>
            {inline(block.text)}
          </p>
        );
      })}
    </section>
  );
}
