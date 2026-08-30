'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

/* next/dynamic, not lazy + Suspense. Both close the blank gap, but plain lazy
   loses Next's chunk preloading and cost this route 5 Lighthouse points —
   measured, median 0.89 against a 0.92 floor. `dynamic`'s `loading` cannot be
   passed a prop, so the fallback reaches it through context instead. */
const FallbackContext = createContext<ReactNode>(null);

function Fallback() {
  return <>{useContext(FallbackContext)}</>;
}

const IndexWorkspace = dynamic(() => import('./IndexWorkspace'), {
  ssr: false,
  // Without this the manifest vanished the moment hydration flipped and the
  // notes sat in a blank section for the length of the chunk request — and
  // never came back if it failed.
  loading: () => <Fallback />,
});

function subscribeToNothing(): () => void {
  return () => {};
}

const onClient = () => true;
const onServer = () => false;

/**
 * Renders the server-rendered fallback until the workspace is really on screen.
 *
 * @param fallback The manifest, or the loading shell when the index gave nothing.
 */
export default function IndexWorkspaceLoader({ fallback }: Readonly<{ fallback: ReactNode }>) {
  // The store never changes; reading the two snapshots apart is what tells a
  // hydration render from a client one, and keeps the workspace off the server.
  const hydrated = useSyncExternalStore(subscribeToNothing, onClient, onServer);
  if (!hydrated) return fallback;

  return (
    <FallbackContext.Provider value={fallback}>
      <IndexWorkspace />
    </FallbackContext.Provider>
  );
}
