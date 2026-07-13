import Image from 'next/image';
import styles from './Portrait.module.css';

interface PortraitProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function Portrait({ src, alt, width, height }: Readonly<PortraitProps>) {
  return (
    <figure className={styles.portrait}>
      <span className={styles.grid} aria-hidden="true" />
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={styles.image}
        priority
        // Frame is capped at 420px (max-width) and sits in a 360px column above
        // 900px, so it never renders wider than that — don't fetch for 100vw.
        sizes="(max-width: 900px) min(100vw, 420px), 360px"
      />
      <figcaption className={styles.meta} aria-hidden="true">
        <span>SUBJECT · 026</span>
        <span>YEAR · 2026</span>
      </figcaption>
    </figure>
  );
}
