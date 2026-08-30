'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const IndexWorkspace = dynamic(() => import('./IndexWorkspace'), { ssr: false });

function subscribeToNothing(): () => void {
  return () => {};
}

const onClient = () => true;
const onServer = () => false;

/* Renders the server-rendered manifest until the workspace is on the client.

   Not `dynamic`'s own `loading`, which cannot be handed data from the server:
   with ssr: false the route emitted a spinner and nothing else, so the corpus
   was absent from the HTML for every crawler and for anyone without scripting.
   The manifest IS the fallback, so the two never render together. */
export default function IndexWorkspaceLoader({ fallback }: Readonly<{ fallback: ReactNode }>) {
  // The store never changes; the two snapshots are the whole point, and reading
  // them apart is what tells a hydration render from a client one.
  const hydrated = useSyncExternalStore(subscribeToNothing, onClient, onServer);

  return hydrated ? <IndexWorkspace /> : fallback;
}
