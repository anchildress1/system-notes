'use client';

import { memo, ReactNode } from 'react';
import Button from '@/components/Button/Button';

interface SourceLinkButtonProps {
  url: string;
  label: string;
  icon: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  tabIndex?: number;
}

export default memo(
  function SourceLinkButton({
    url,
    label,
    icon,
    onClick,
    tabIndex,
  }: Readonly<SourceLinkButtonProps>) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onClick) {
        onClick(e);
      } else {
        globalThis.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <Button variant="icon" ariaLabel={label} onClick={handleClick} tabIndex={tabIndex}>
        {icon}
      </Button>
    );
  },
  (prev, next) =>
    prev.url === next.url &&
    prev.label === next.label &&
    prev.onClick === next.onClick &&
    prev.tabIndex === next.tabIndex
);
