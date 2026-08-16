import {
  forwardRef,
  type AriaAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'fab' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonAccent = 'violet' | 'pink' | 'teal' | 'gold';
export type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

type ButtonClickEvent = MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
type ButtonKeyboardEvent = KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>;

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  accent?: ButtonAccent;
  icon?: ReactNode;
  iconRight?: ReactNode;
  href?: string;
  target?: string;
  disabled?: boolean;
  onClick?: (e: ButtonClickEvent) => void;
  onKeyDown?: (e: ButtonKeyboardEvent) => void;
  children?: ReactNode;
  className?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-current'?: NonNullable<AriaAttributes['aria-current']>;
  'aria-controls'?: string;
  'aria-haspopup'?: NonNullable<AriaAttributes['aria-haspopup']>;
  'data-state'?: string;
  'data-testid'?: string;
}

const Button = forwardRef<ButtonElement, Readonly<ButtonProps>>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    accent = 'violet',
    icon,
    iconRight,
    href,
    target,
    disabled = false,
    onClick,
    onKeyDown,
    children,
    className,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    'aria-current': ariaCurrent,
    'aria-controls': ariaControls,
    'aria-haspopup': ariaHaspopup,
    'data-state': dataState,
    'data-testid': dataTestId,
  },
  ref
) {
  const classes = [styles.btn, className].filter(Boolean).join(' ');
  const inner = (
    <>
      {icon && <span className={styles.iconLeft}>{icon}</span>}
      {children}
      {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
    </>
  );

  const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

  if (href && !disabled) {
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={classes}
        data-variant={variant}
        data-size={size}
        data-accent={accent}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-current={ariaCurrent}
        aria-controls={ariaControls}
        aria-haspopup={ariaHaspopup}
        data-state={dataState}
        data-testid={dataTestId}
        tabIndex={tabIndex}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-accent={accent}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-current={ariaCurrent}
      aria-controls={ariaControls}
      aria-haspopup={ariaHaspopup}
      data-state={dataState}
      data-testid={dataTestId}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {inner}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
