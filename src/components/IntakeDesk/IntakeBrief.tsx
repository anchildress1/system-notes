'use client';

import { useEffect } from 'react';
import { liteClient } from 'algoliasearch/lite';
import { InstantSearch, useChat } from 'react-instantsearch';
import Link from 'next/link';
import type { UIMessage } from 'instantsearch.js/es/lib/ai-lite';
import { ALGOLIA_APP_ID, ALGOLIA_INTAKE_AGENT_ID, ALGOLIA_SEARCH_KEY } from '@/lib/algolia';
import BriefBody from './BriefBody';
import { ALGOLIA_INDEX_NAME } from '@/config';
import styles from './IntakeDesk.module.css';

/**
 * Reads the answer out of a message.
 *
 * A turn arrives as parts — text alongside reasoning, tool calls and sources.
 * Only the text parts are the answer; the rest is how it was arrived at.
 *
 * @param message A completed turn.
 * @returns The text of the turn, or an empty string when it carried none.
 */
export function messageText(message: UIMessage | undefined): string {
  if (!message) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
    .trim();
}

/**
 * Sends one question to the agent and renders the answer once it settles.
 *
 * There is no conversation here. The component mounts with the question already
 * attached, the agent answers once, and asking again remounts it — which is why
 * the page keys this on the question text.
 */
function Brief({ question, onSettled }: Readonly<BriefProps>) {
  const { messages, status, error } = useChat({
    agentId: ALGOLIA_INTAKE_AGENT_ID,
    // The connector otherwise asserts that a chat trigger or AI mode exists.
    // This is an input on a page, not a chat that opens.
    disableTriggerValidation: true,
    initialUserMessage: question,
  });

  const answer = messageText(
    [...messages].reverse().find((message) => message.role === 'assistant')
  );
  const isWorking = status === 'submitted' || status === 'streaming';

  // Hand the settled answer up so it outlives this component. The agent call is
  // not repeatable for free, and leaving the page should not spend another one.
  useEffect(() => {
    if (!isWorking && answer) onSettled?.(answer);
  }, [answer, isWorking, onSettled]);

  if (error || status === 'error') {
    return (
      <output className={styles.briefFailure}>
        <p>
          The agent could not answer that. The index and the exhibits hold the same evidence it
          reads from, and both are working.
        </p>
        <p className={styles.briefFailureLinks}>
          <Link href="/notes">Search the index</Link>
          <Link href="/projects">See what I&apos;ve shipped</Link>
        </p>
      </output>
    );
  }

  // Nothing is rendered mid-stream on purpose: a brief that assembles itself
  // under the reader is a chat window. It arrives finished or not at all.
  if (isWorking || !answer) {
    return (
      <output className={styles.briefWorking}>
        <span className={styles.briefWorkingLabel}>Reading the evidence</span>
        <span className={styles.briefCaret} aria-hidden="true" />
      </output>
    );
  }

  return <BriefBody question={question} answer={answer} />;
}

interface BriefProps {
  question: string;
  /** Called once with the finished answer, so it can be kept beyond this mount. */
  onSettled?: (answer: string) => void;
}

export default function IntakeBrief({ question, onSettled }: Readonly<BriefProps>) {
  // The agent is reached over the same host and credentials as search, so an
  // InstantSearch provider is what supplies them. No search is run here.
  const searchClient = liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

  return (
    <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEX_NAME}>
      <Brief question={question} onSettled={onSettled} />
    </InstantSearch>
  );
}
