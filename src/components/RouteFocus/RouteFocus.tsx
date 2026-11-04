'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Moves focus to the new page's main landmark after a client-side navigation; `tabIndex=-1` keeps it out of the tab order and `preventScroll` leaves scroll to the router. */
export default function RouteFocus() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Make the landmark focusable on every pass, including the first. The skip
    // link targets it too, and a fragment link to an element that cannot hold
    // focus only scrolls: activating it left activeElement on <body>, so the
    // next Tab went to the second nav item instead of into the content.
    const landmark = document.getElementById('main-content');
    if (landmark) landmark.tabIndex = -1;

    // The first pass is the initial load, not a navigation. Focusing there would
    // take focus off whatever the reader had already reached.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Deferred a frame on purpose. usePathname updates as soon as the URL does,
    // which is a commit earlier than the new segment: focusing there lands on the
    // OUTGOING main, React then unmounts it, and focus falls to <body>. A frame
    // later the new landmark is mounted and the focus sticks.
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById('main-content');
      if (!main) return;

      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
