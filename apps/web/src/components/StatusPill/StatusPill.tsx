import { ReactNode } from 'react';
import styles from './StatusPill.module.css';

interface StatusPillProps {
  /** Leading pulsing teal dot. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/** Recessed `SYS · /path` chip with a pulsing dot — the header/system status label. */
export default function StatusPill({ dot = true, children, className }: Readonly<StatusPillProps>) {
  return (
    <span className={[styles.pill, className].filter(Boolean).join(' ')}>
      {dot && <span className={`${styles.dot} pulse-dot`} aria-hidden="true" />}
      {children}
    </span>
  );
}
