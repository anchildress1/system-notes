import { ReactNode } from 'react';
import styles from './Tag.module.css';

export type TagVariant = 'solid' | 'outline';

interface TagProps {
  /** `solid` sits on an elevated fill; `outline` is a quieter bordered chip. */
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}

/** Low-key mono chip for tech stacks, facets, and metadata. */
export default function Tag({ variant = 'solid', children, className }: Readonly<TagProps>) {
  return (
    <span className={[styles.tag, className].filter(Boolean).join(' ')} data-variant={variant}>
      {children}
    </span>
  );
}
