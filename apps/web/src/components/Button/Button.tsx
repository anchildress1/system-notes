import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  type MouseEventHandler,
  Ref,
  forwardRef,
  type ReactNode,
} from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'secondary' | 'ghost' | 'fab' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonAccent = 'violet' | 'pink' | 'teal' | 'gold';

type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

interface ButtonBaseProps {
  /** Visual treatment. `secondary` is the standard neutral CTA. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Drives the gradient/glow hue via the shared `data-accent` token system. */
  accent?: ButtonAccent;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Optional visual label override for non-text buttons. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Test selector passthrough. */
  dataTestId?: string;
  /** Keep this narrow for shared focus/scrolling semantics. */
  tabIndex?: number;
  /** Click semantics. */
  onClick?: MouseEventHandler<ButtonElement>;
  /** Child content; optional for icon-only buttons. */
  children?: ReactNode;
}

type ButtonButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'type'> & {
    href?: undefined;
  };

type ButtonAnchorProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'aria-label'> & {
    href: string;
  };

export type ButtonProps = ButtonButtonProps | ButtonAnchorProps;

/**
 * Shared button primitive.
 *
 * - button styles are driven by `data-variant`, `data-size`, and `data-accent`
 * - anchors and buttons share the same visual identity
 */
const Button = forwardRef<ButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      accent = 'violet',
      icon,
      iconRight,
      href,
      disabled = false,
      children,
      className,
      ariaLabel,
      dataTestId,
      tabIndex,
      onClick,
      ...rest
    },
    ref
  ) => {
    const classes = [styles.btn, className].filter(Boolean).join(' ');
    const ariaLabelText = ariaLabel;
    const commonAttrs = {
      'data-variant': variant,
      'data-size': size,
      'data-accent': accent,
      'aria-label': ariaLabelText,
      className: classes,
      onClick,
      tabIndex,
      'data-testid': dataTestId,
    } as const;

    const childrenRender = (
      <>
        {icon && <span className={styles.iconLeft}>{icon}</span>}
        {children}
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </>
    );

    // External links get noopener/noreferrer; internal/_self links keep their own rel.
    if (href && !disabled) {
      const anchorProps = rest as Omit<
        ButtonAnchorProps,
        keyof ButtonBaseProps | 'onClick' | 'href'
      >;
      const { target, rel: explicitRel, ...anchorPropsWithoutTarget } = anchorProps;
      const rel = target === '_blank' ? (explicitRel ?? 'noopener noreferrer') : explicitRel;

      return (
        <a
          href={href}
          target={target}
          rel={rel}
          ref={ref as Ref<HTMLAnchorElement>}
          {...commonAttrs}
          {...anchorPropsWithoutTarget}
        >
          {childrenRender}
        </a>
      );
    }

    const buttonProps = rest as Omit<ButtonButtonProps, keyof ButtonBaseProps | 'onClick'>;

    return (
      <button
        type="button"
        disabled={disabled}
        ref={ref as Ref<HTMLButtonElement>}
        {...commonAttrs}
        {...buttonProps}
      >
        {childrenRender}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { type ButtonVariant, type ButtonSize, type ButtonAccent, type ButtonElement };
