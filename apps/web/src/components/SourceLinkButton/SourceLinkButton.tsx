'use client';

import { ReactNode } from 'react';
import styles from './SourceLinkButton.module.css';

interface SourceLinkButtonProps {
  url: string;
  label: string;
  icon: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export default function SourceLinkButton({ url, label, icon, onClick }: SourceLinkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    } else {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      className={styles.sourceLink}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={label}
    >
      {icon}
    </span>
  );
}
