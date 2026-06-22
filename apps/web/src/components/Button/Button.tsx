import { ReactNode, MouseEvent } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'fab' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAccent = 'violet' | 'pink' | 'teal' | 'gold';

interface ButtonProps {
  /** Visual treatment. `primary`/`fab` carry the spectral gradient fill. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Drives the gradient/glow hue via the shared `data-accent` token system. */
  accent?: ButtonAccent;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Renders an `<a>` when set; otherwise a `<button>`. */
  href?: string;
  target?: string;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  dataTestId?: string;
  tabIndex?: number;
}

/**
 * The System Notes action primitive: a mono, uppercase-tracked button with a
 * spectral `primary`/`fab` fill, a neon-tinted `secondary`, and a monochrome
 * `ghost`. Hue comes from `accent` via the shared `data-accent` token system.
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  accent = 'violet',
  icon,
  iconRight,
  href,
  target,
  disabled = false,
  onClick,
  children,
  className,
  ariaLabel,
  dataTestId,
  tabIndex,
}: Readonly<ButtonProps>) {
  const classes = [styles.btn, className].filter(Boolean).join(' ');

  const inner = (
    <>
      {icon && <span className={styles.iconLeft}>{icon}</span>}
      {children}
      {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
    </>
  );

  // External links get noopener/noreferrer; internal/_self links don't need it.
  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        data-variant={variant}
        data-size={size}
        data-accent={accent}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        tabIndex={tabIndex}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-accent={accent}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}
