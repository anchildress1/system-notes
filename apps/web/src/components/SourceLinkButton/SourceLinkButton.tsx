'use client';

import { memo, ReactNode } from 'react';
import styles from './SourceLinkButton.module.css';

interface SourceLinkButtonProps {
  url: string;
  label: string;
  icon: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export default memo(function SourceLinkButton({
  url,
  label,
  icon,
  onClick,
}: SourceLinkButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(e);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button type="button" className={styles.sourceLink} onClick={handleClick} aria-label={label}>
      {icon}
    </button>
  );
});
