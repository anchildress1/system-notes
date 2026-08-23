'use client';

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
    // An unsafe or malformed url loses its link and keeps its words: the
    // citation still reads, it just stops being clickable.
    segments.push(isSafeExternalUrl(href) ? { text: label!, href } : { text: label! });
    cursor = start + whole.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** The settled brief. Renders identically whether it just arrived or was restored. */
export default function BriefBody({
  question,
  answer,
}: Readonly<{ question: string; answer: string }>) {
  return (
    <section className={styles.brief} aria-label="The brief">
      <p className={styles.briefQuestion}>{question}</p>
      {answer.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph} className={styles.briefBody}>
          {parseBrief(paragraph).map((segment, index) =>
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
          )}
        </p>
      ))}
    </section>
  );
}
