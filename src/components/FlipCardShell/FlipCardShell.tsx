import type { ReactNode } from 'react';
import cardStyles from '@/styles/card.module.css';

interface FlipCardShellProps {
  accent: string;
  cardClassName: string;
  children: ReactNode;
  className: string;
  featured?: boolean;
  flipperClassName: string;
  front: ReactNode;
  frontClassName: string;
  isFlipped: boolean;
  size?: string;
  testId?: string;
}

export default function FlipCardShell({
  accent,
  cardClassName,
  children,
  className,
  featured = false,
  flipperClassName,
  front,
  frontClassName,
  isFlipped,
  size,
  testId,
}: Readonly<FlipCardShellProps>) {
  const seamClassName = featured ? `${cardStyles.winnerBanner} shimmer-seam` : cardStyles.seam;

  return (
    <article className={className} data-accent={accent} data-size={size} data-testid={testId}>
      <div
        className={`${cardClassName} ${cardStyles.frame}`}
        data-state={isFlipped ? 'expanded' : 'collapsed'}
      >
        <div className={`${flipperClassName} ${cardStyles.flipper}`}>
          <div
            className={`${frontClassName} ${cardStyles.flipFront} ${cardStyles.face} ${seamClassName}`}
            aria-hidden={isFlipped}
          >
            {front}
          </div>
          {children}
        </div>
      </div>
    </article>
  );
}
