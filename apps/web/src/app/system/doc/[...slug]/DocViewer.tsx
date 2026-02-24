'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

interface DocViewerProps {
  content: string;
}

export default function DocViewer({ content }: Readonly<DocViewerProps>) {
  // Handle hash navigation on mount
  useEffect(() => {
    if (globalThis.location.hash) {
      const id = globalThis.location.hash.substring(1);
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
        {lines.map((_, i) => {
          const lineNum = i + 1;
          return (
            <div key={lineNum} id={`L${lineNum}`} className={styles.lineNumber}>
              <a href={`#content-L${lineNum}`}>{lineNum}</a>
            </div>
          );
        })}
      </div>
      <div className={styles.content}>
        {lines.map((line, i) => {
          const lineNum = i + 1;
          return (
            <div key={lineNum} className={styles.lineContent} id={`content-L${lineNum}`}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}
