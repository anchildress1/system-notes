'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

interface DocViewerProps {
  content: string;
}

export default function DocViewer({ content }: DocViewerProps) {
  // Handle hash navigation on mount
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, []);

  const lines = content.split('\n');

  return (
    <div className={styles.editor}>
      <div className={styles.gutter}>
        {lines.map((_, i) => (
          <div key={i} id={`L${i + 1}`} className={styles.lineNumber}>
            <a href={`#content-L${i + 1}`}>{i + 1}</a>
          </div>
        ))}
      </div>
      <div className={styles.content}>
        {lines.map((line, i) => (
          <div key={i} className={styles.lineContent} id={`content-L${i + 1}`}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
