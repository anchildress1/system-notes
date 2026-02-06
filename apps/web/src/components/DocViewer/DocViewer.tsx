'use client';

import { useEffect, useState } from 'react';
import styles from './DocViewer.module.css';

interface DocViewerProps {
  content: string;
}

export default function DocViewer({ content }: DocViewerProps) {
  // Ensure we split correctly on newlines, handling potential CRLF
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Parse #Lx-Ly or #Lx
        const match = hash.match(/#L(\d+)(?:-L(\d+))?/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : start;
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
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
            key={index}
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
