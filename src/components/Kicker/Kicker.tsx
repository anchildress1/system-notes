import { ReactNode } from 'react';
import styles from './Kicker.module.css';

type KickerTone = 'teal' | 'dim' | 'accent';
type KickerAccent = 'violet' | 'pink' | 'teal' | 'gold';

interface KickerProps {
  tone?: KickerTone;
  accent?: KickerAccent;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Kicker({
  tone = 'teal',
  accent = 'violet',
  dot,
  children,
  className,
}: Readonly<KickerProps>) {
  const showDot = dot ?? tone === 'teal';
  return (
    <span
      className={[styles.kicker, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-accent={accent}
    >
      {showDot && <span className={`${styles.dot} pulse-dot`} aria-hidden="true" />}
      {children}
    </span>
  );
}
