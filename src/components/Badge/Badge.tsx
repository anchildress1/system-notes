import { ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'neutral' | 'accent' | 'award';
type BadgeAccent = 'violet' | 'pink' | 'teal' | 'gold';

interface BadgeProps {
  variant?: BadgeVariant;
  accent?: BadgeAccent;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  accent = 'violet',
  icon,
  children,
  className,
}: Readonly<BadgeProps>) {
  return (
    <span
      className={[styles.badge, variant === 'award' && 'shimmer', className]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
      data-accent={accent}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
