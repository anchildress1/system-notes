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
      prefetch={active ? null : false}
      onPointerEnter={() => setActive(true)}
      onFocus={() => setActive(true)}
    />
  );
}
