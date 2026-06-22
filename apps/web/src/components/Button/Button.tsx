import {
  forwardRef,
  type AriaAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'fab' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAccent = 'violet' | 'pink' | 'teal' | 'gold';
export type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

type ButtonClickEvent = MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
type ButtonKeyboardEvent = KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>;

interface ButtonProps {
  /** Visual treatment. `primary` is high-emphasis; `fab` is the fixed utility control. */
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
  onClick?: (e: ButtonClickEvent) => void;
  onKeyDown?: (e: ButtonKeyboardEvent) => void;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  ariaCurrent?: AriaAttributes['aria-current'];
  ariaControls?: string;
  ariaHaspopup?: AriaAttributes['aria-haspopup'];
  dataState?: string;
  dataTestId?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-current'?: AriaAttributes['aria-current'];
  'aria-controls'?: string;
  'aria-haspopup'?: AriaAttributes['aria-haspopup'];
  'data-state'?: string;
  'data-testid'?: string;
}

/**
 * The System Notes action primitive: a mono, uppercase-tracked button with a
 * pale `primary`, outlined `secondary`, quiet `ghost`, and neutral utility
 * `fab`. Hue comes from `accent` via the shared `data-accent` token system.
 */
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
    ariaLabel,
    ariaExpanded,
    ariaPressed,
    ariaCurrent,
    ariaControls,
    ariaHaspopup,
    dataState,
    dataTestId,
    tabIndex,
    'aria-label': ariaLabelAttr,
    'aria-expanded': ariaExpandedAttr,
    'aria-pressed': ariaPressedAttr,
    'aria-current': ariaCurrentAttr,
    'aria-controls': ariaControlsAttr,
    'aria-haspopup': ariaHaspopupAttr,
    'data-state': dataStateAttr,
    'data-testid': dataTestIdAttr,
  },
  ref
) {
  const classes = [styles.btn, className].filter(Boolean).join(' ');
  const resolvedAriaLabel = ariaLabel ?? ariaLabelAttr;
  const resolvedAriaExpanded = ariaExpanded ?? ariaExpandedAttr;
  const resolvedAriaPressed = ariaPressed ?? ariaPressedAttr;
  const resolvedAriaCurrent = ariaCurrent ?? ariaCurrentAttr;
  const resolvedAriaControls = ariaControls ?? ariaControlsAttr;
  const resolvedAriaHaspopup = ariaHaspopup ?? ariaHaspopupAttr;
  const resolvedDataState = dataState ?? dataStateAttr;
  const resolvedDataTestId = dataTestId ?? dataTestIdAttr;

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
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={classes}
        data-variant={variant}
        data-size={size}
        data-accent={accent}
        aria-label={resolvedAriaLabel}
        aria-expanded={resolvedAriaExpanded}
        aria-current={resolvedAriaCurrent}
        aria-controls={resolvedAriaControls}
        aria-haspopup={resolvedAriaHaspopup}
        data-state={resolvedDataState}
        data-testid={resolvedDataTestId}
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
      aria-label={resolvedAriaLabel}
      aria-expanded={resolvedAriaExpanded}
      aria-pressed={resolvedAriaPressed}
      aria-current={resolvedAriaCurrent}
      aria-controls={resolvedAriaControls}
      aria-haspopup={resolvedAriaHaspopup}
      data-state={resolvedDataState}
      data-testid={resolvedDataTestId}
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
