'use client';

import { useSyncExternalStore } from 'react';
import type { IndexPulse } from '@/lib/indexPulse';
import { relativeAge } from '@/lib/relativeAge';

/** The age depends on the clock, not on a store anything can push to. */
const subscribeToNothing = () => () => {};

/**
 * How much is on file and when it last moved. Renders a span so it can sit inside a paragraph.
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
