'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import Link from 'next/link';
import type { UIMessage } from 'ai';
import { ALGOLIA_APP_ID, ALGOLIA_AGENT_ID, ALGOLIA_SEARCH_KEY } from '@/lib/algolia';
import BriefBody from './BriefBody';
import styles from './IntakeDesk.module.css';

/* Reads the answer out of a message. A turn arrives as parts — text alongside
   reasoning, tool calls and sources — and only the text parts are the answer.

   @param message A completed turn.
   @returns The text of the turn, or an empty string when it carried none. */
export function messageText(message: UIMessage | undefined): string {
  if (!message) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
    .trim();
}

/* Talks to the Agent Studio completions endpoint directly.

   Not react-instantsearch's chat connector: it persists `initialUserMessage` to
   sessionStorage and rehydrates it into every Chat it builds, which makes
   `hasExistingMessages` true — and the connector only auto-sends when that is
   false. After the first question the request was never issued again for the life
   of the browser session, with no error and no network call.

   Built once at module scope: a new transport identity would rebuild the chat
   underneath an in-flight request. Credentials come from the environment, never
   from a literal — a key pasted into source outlives its rotation. */
const transport = new DefaultChatTransport({
  api: `https://${ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${ALGOLIA_AGENT_ID}/completions?stream=true&compatibilityMode=ai-sdk-5`,
  headers: {
    'x-algolia-application-id': ALGOLIA_APP_ID,
    'x-algolia-api-key': ALGOLIA_SEARCH_KEY,
  },
});

/* How long a turn may run before the desk stops waiting. A floor under the
   interface rather than a deadline for the agent: without it a request that never
   resolves leaves the form disabled with a running sweep and no way back. */
const TURN_TIMEOUT_MS = 45_000;

interface BriefProps {
  question: string;
  /** Called once with the finished answer, so it can be kept beyond this mount. */
  onSettled?: (answer: string) => void;
  /* Called once when the turn stops running for any reason — answered, failed, or
     timed out. It must fire on the unhappy paths too; `onSettled` alone left the
     button dead after an error. */
  onFinished?: () => void;
}

/* Sends one question to the agent and renders the answer once it settles. There is
   no conversation: asking again remounts the component, which is why the page keys
   it on the question text. */
export default function IntakeBrief({ question, onSettled, onFinished }: Readonly<BriefProps>) {
  const [timedOut, setTimedOut] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [emptyCompletion, setEmptyCompletion] = useState(false);
  const { messages, status, error, sendMessage, stop } = useChat({
    transport,
    onError: () => setSendFailed(true),
    onFinish: ({ message, isAbort, isError }) => {
      if (!isAbort && !isError && !messageText(message)) setEmptyCompletion(true);
    },
  });

  // Sent explicitly, once per mount, rather than by handing the hook an initial
  // message. The ref survives StrictMode's double-invoked effect, which would
  // otherwise ask the same question twice.
  const hasSent = useRef(false);
  useEffect(() => {
    if (hasSent.current) return;
    hasSent.current = true;
    void sendMessage({ text: question }).catch(() => setSendFailed(true));
  }, [question, sendMessage]);

  const answer = messageText(
    [...messages].reverse().find((message) => message.role === 'assistant')
  );
  const failed = Boolean(error) || status === 'error' || timedOut || sendFailed || emptyCompletion;
  const isWorking = !failed && (status === 'submitted' || status === 'streaming');

  // Stop waiting rather than wait forever. The request is aborted so a late
  // response cannot arrive after the desk has already moved on.
  useEffect(() => {
    if (!isWorking) return undefined;
    const timer = setTimeout(() => {
      stop();
      setTimedOut(true);
    }, TURN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isWorking, stop]);
  const settled = failed || (!isWorking && Boolean(answer));
  const hasFinished = useRef(false);
  useEffect(() => {
    if (!settled || hasFinished.current) return;
    hasFinished.current = true;
    onFinished?.();
  }, [settled, onFinished]);

  // Hand the settled answer up so it outlives this component. The agent call is
  // not repeatable for free, and leaving the page should not spend another one.
  const hasSettledAnswer = useRef(false);
  useEffect(() => {
    if (isWorking || !answer || hasSettledAnswer.current) return;
    hasSettledAnswer.current = true;
    onSettled?.(answer);
  }, [answer, isWorking, onSettled]);

  if (failed) {
    return (
      <output className={styles.briefFailure}>
        {/* The question is echoed here too. The desk clears the field on submit,
            so without this a failed turn would take the reader's words with it. */}
        <p className={styles.briefQuestion}>{question}</p>
        <p>
          {timedOut
            ? 'The agent did not answer in time. The index and the exhibits hold the same evidence it reads from, and both are working.'
            : 'The agent could not answer that. The index and the exhibits hold the same evidence it reads from, and both are working.'}
        </p>
        <p className={styles.briefFailureLinks}>
          <Link href="/notes">Search the index</Link>
          <Link href="/projects">See what I&rsquo;ve shipped</Link>
        </p>
      </output>
    );
  }

  // No text is rendered mid-stream: a brief that assembles itself under the reader is
  // a chat window. The wait shows the question it is answering — the same element
  // BriefBody opens with, so the panel keeps its shape when the answer lands.
  if (isWorking || !answer) {
    return (
      <output className={styles.briefWorking} aria-busy="true">
        <span className={styles.briefWorkingHead}>
          <span className={styles.briefWorkingLabel}>Reading the evidence</span>
          <span className={styles.briefCaret} aria-hidden="true" />
        </span>
        <span className={styles.briefSweep} aria-hidden="true" />
        <span className={styles.briefQuestion}>{question}</span>
      </output>
    );
  }

  return <BriefBody question={question} answer={answer} />;
}
