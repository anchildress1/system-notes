'use client';

import { citesKnownSystem } from '@/lib/systemIds';
import { isSafeExternalUrl } from '@/lib/urlSafety';
import styles from './IntakeDesk.module.css';

/** One inline citation the agent wrote, or a run of plain prose. */
export type BriefSegment = { text: string; href?: string };

const LINK = /\[([^\]\n]+)\]\((\S+?)\)/g;

/**
 * Splits an answer into prose and the links written into it.
 *
 * The agent is asked for `[title](url)` and nothing else, and this resolves that
 * one construct. It is parsed rather than injected: the answer is model output
 * shaped partly by indexed content, so it is untrusted, and handing it to
 * dangerouslySetInnerHTML would make any tag it emitted executable. Parsing
 * yields React elements, which cannot become markup.
 *
 * @param text One paragraph of the answer.
 * @returns Segments in order; `href` is present only on links safe to follow.
 */
export function parseBrief(text: string): BriefSegment[] {
  const segments: BriefSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    // An unsafe url, or a project link naming a system that is not on file,
    // loses its link and keeps its words: the citation still reads, it just
    // stops being clickable.
    const followable = isSafeExternalUrl(href) && citesKnownSystem(href);
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

/**
 * Reads the shape of an answer so it can be set as an argument rather than as a
 * wall of identical paragraphs.
 *
 * The structure is not invented: the agent reliably opens with what is and is
 * not already built, walks numbered steps signposted `First,` / `Next,` /
 * `Then,` / `Finally,`, turns to what it would refuse with `I would not`, and
 * closes by synthesising. This reads that shape back out.
 *
 * The ordinal word is lifted out of the sentence into a margin marker rather
 * than deleted — the same words, relocated. Numbering comes from position, not
 * from the word, so a repeated `Next,` cannot desync the count.
 *
 * Everything degrades: fewer than {@link MIN_STEPS} signposted paragraphs means
 * the run was coincidence and every block stays plain prose. An answer with no
 * recognised shape renders exactly as it did before.
 *
 * @param answer The settled answer, paragraphs separated by blank lines.
 * @returns One block per paragraph, in order.
 */
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
  const inline = (text: string) =>
    parseBrief(text).map((segment, index) =>
      segment.href ? (
        <a
          key={`${segment.href}:${index}`}
          href={segment.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.briefLink}
        >
          {segment.text}
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      ) : (
        <span key={`text:${index}`}>{segment.text}</span>
      )
    );

  return (
    <section className={styles.brief} aria-label="The brief">
      <p className={styles.briefQuestion}>{question}</p>
      {/* Placed above the answer, not under it. This is a provenance line, and a
          disclosure a reader meets after they have already believed something is
          a footnote, not a disclosure. It sits with the question because both are
          metadata about the answer rather than part of it. */}
      <p className={styles.briefCredit}>An agent wrote this from evidence I&rsquo;ve filed.</p>
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
