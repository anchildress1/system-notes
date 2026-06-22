import { ReactNode } from 'react';
import styles from './Kicker.module.css';

export type KickerTone = 'teal' | 'dim' | 'accent';
export type KickerAccent = 'violet' | 'pink' | 'teal' | 'gold';

interface KickerProps {
  /** `teal` hero label, `dim` section overline, `accent` color-coded by hue. */
  tone?: KickerTone;
  accent?: KickerAccent;
  /** Leading pulsing dot. Defaults on for `teal`, off otherwise. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/** Terminal-style overline label — hero kickers, `// section` labels, NODE tags. */
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
