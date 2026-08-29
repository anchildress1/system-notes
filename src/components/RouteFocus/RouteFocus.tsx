'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/*
   Moves focus to the new page's main landmark after a client-side navigation.

   Without this, focus stays on the nav link that was activated. Chrome
   re-evaluates :focus-visible on the NEXT keypress, so a reader who clicked a
   link with the mouse and then pressed an arrow key to scroll had the focus ring
   appear on a link they were no longer using. The ring was correct about the
   element; the element was wrong about the focus.

   It is also what a soft navigation owes a keyboard or screen reader user, who
   would otherwise be stranded in the header of a page they have already left.

   tabIndex is set here rather than on each `main` so a new route cannot forget
   it; -1 keeps the landmark out of the tab sequence while allowing focus().
   preventScroll because the router already restores scroll position.
*/
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
