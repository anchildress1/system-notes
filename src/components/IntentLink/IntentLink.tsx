'use client';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';

type IntentLinkProps = Pick<
  ComponentProps<typeof Link>,
  'href' | 'children' | 'className' | 'aria-current'
>;

export default function IntentLink(props: IntentLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      // false, not true: this link opts OUT of Link's own viewport-triggered
      // prefetch until pointer/focus intent, then hands back `null` — the
      // documented default — rather than forcing prefetch on regardless of it.
      prefetch={active ? null : false}
      onPointerEnter={() => setActive(true)}
      onFocus={() => setActive(true)}
    />
  );
}
