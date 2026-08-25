'use client';

import { useSyncExternalStore } from 'react';
import type { IndexPulse } from '@/lib/indexPulse';
import { relativeAge } from '@/lib/relativeAge';

/** The age depends on the clock, not on a store anything can push to. */
const subscribeToNothing = () => () => {};

/**
 * How much is on file and when it last moved.
 *
 * Renders a span so it can sit in the page head's slug, which is a paragraph —
 * the corpus is a fact about the page, not about the search that happens to be
 * running on it, so it belongs with the page's own metadata rather than beside
 * a result count that changes on every keystroke.
 *
 * Still a client component. The age resolves against the reader's own clock:
 * this page is statically rendered, so an age computed on the server would be
 * stamped at build time and then quietly rot.
 */
export default function IndexPulseLine({ pulse }: Readonly<{ pulse: IndexPulse }>) {
  const age = useSyncExternalStore(
    subscribeToNothing,
    () => relativeAge(pulse.latestCreatedAt),
    () => null
  );

  return (
    <span>
      {pulse.total.toLocaleString()} on file{age ? ` · updated ${age}` : ''}
    </span>
  );
}
