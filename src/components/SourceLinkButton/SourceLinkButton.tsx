'use client';

import type { MouseEvent, ReactNode } from 'react';
import Button from '@/components/Button/Button';
import { isSafeExternalUrl } from '@/lib/urlSafety';

interface SourceLinkButtonProps {
  url: string;
  label: string;
  icon: ReactNode;
  tabIndex?: number;
}

export default function SourceLinkButton({
  url,
  label,
  icon,
  tabIndex,
}: Readonly<SourceLinkButtonProps>) {
  if (!isSafeExternalUrl(url)) return null;

  return (
    <Button
      variant="icon"
      href={url}
      target="_blank"
      aria-label={label}
      onClick={(event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) =>
        event.stopPropagation()
      }
      tabIndex={tabIndex}
    >
      {icon}
    </Button>
  );
}
