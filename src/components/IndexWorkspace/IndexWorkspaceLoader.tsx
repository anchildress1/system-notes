'use client';

import { createContext, useContext, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

/* next/dynamic rather than lazy + Suspense, so Next emits the chunk's preload
   hint. `loading` takes no props, so the fallback reaches it by context. */
const FallbackContext = createContext<ReactNode>(null);

function Fallback() {
  return <>{useContext(FallbackContext)}</>;
}

/* With ssr: false the workspace never renders on the server — `loading` does,
   which is how the manifest reaches the HTML. It also holds the manifest on the
   client until the chunk resolves; without it the notes dropped into a blank
   section for the length of that request and never returned if it failed. */
const IndexWorkspace = dynamic(() => import('./IndexWorkspace'), {
  ssr: false,
  loading: () => <Fallback />,
});

/**
 * Renders the server-rendered fallback until the workspace is really on screen.
 *
 * @param fallback The manifest, or the loading shell when the index gave nothing.
 */
export default function IndexWorkspaceLoader({ fallback }: Readonly<{ fallback: ReactNode }>) {
  // No hydration gate. Returning early kept the dynamic boundary out of the
  // server tree, so Next never learned the chunk existed and could not start
  // fetching it until a post-hydration render.
  return (
    <FallbackContext.Provider value={fallback}>
      <IndexWorkspace />
    </FallbackContext.Provider>
  );
}
