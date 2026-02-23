'use client';

import { useEffect, useState } from 'react';
import styles from './DocViewer.module.css';

interface DocViewerProps {
  content: string;
}

export default function DocViewer({ content }: Readonly<DocViewerProps>) {
  // Ensure we split correctly on newlines, handling potential CRLF
  const lines = content.replaceAll('\r\n', '\n').split('\n');
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = globalThis.location.hash;
      if (hash) {
        // Parse #Lx-Ly or #Lx
        const match = /#L(\d+)(?:-L(\d+))?/.exec(hash);
        if (match) {
          const start = Number.parseInt(match[1], 10);
          const end = match[2] ? Number.parseInt(match[2], 10) : start;
          setHighlightedRange([start, end]);

          // Scroll to the first line
          const element = document.getElementById(`L${start}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          setHighlightedRange(null);
        }
      } else {
        setHighlightedRange(null);
      }
    };

    handleHashChange(); // Initial check
    globalThis.addEventListener('hashchange', handleHashChange);
    return () => globalThis.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isHighlighted = (lineNumber: number) => {
    if (!highlightedRange) return false;
    return lineNumber >= highlightedRange[0] && lineNumber <= highlightedRange[1];
  };

  return (
    <div className={styles.viewer}>
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const highlighted = isHighlighted(lineNumber);

        return (
          <div
            key={lineNumber}
            id={`L${lineNumber}`}
            className={`${styles.line} ${highlighted ? styles.highlighted : ''}`}
          >
            <div className={styles.lineNumber}>{lineNumber}</div>
            <div className={styles.lineContent}>{line || ' '}</div>
          </div>
        );
      })}
    </div>
  );
}
