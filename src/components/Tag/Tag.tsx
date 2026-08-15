import { ReactNode } from 'react';
import styles from './Tag.module.css';

type TagVariant = 'solid' | 'outline';

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}

export default function Tag({ variant = 'solid', children, className }: Readonly<TagProps>) {
  return (
    <span className={[styles.tag, className].filter(Boolean).join(' ')} data-variant={variant}>
      {children}
    </span>
  );
}
