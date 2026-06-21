import { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'accent' | 'award';
export type BadgeAccent = 'violet' | 'pink' | 'teal' | 'gold';

interface BadgeProps {
  /** `neutral` bordered mono, `accent` color-coded by hue, `award` spectral pill. */
  variant?: BadgeVariant;
  accent?: BadgeAccent;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Small uppercase mono label — the shared badge for awards, types, and statuses. */
export default function Badge({
  variant = 'neutral',
  accent = 'violet',
  icon,
  children,
  className,
}: Readonly<BadgeProps>) {
  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-accent={accent}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
