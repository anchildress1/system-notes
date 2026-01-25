'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header/Header';
import { getSystemDoc } from '@/lib/api';
import styles from './page.module.css';

interface Props {
  params: {
    slug: string[];
  };
}

export default function SystemDocPage({ params }: Props) {
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoc() {
      // Reconstruct path from slug array
      const docPath = params.slug.join('/');

      const doc = await getSystemDoc(docPath);

      if (!doc || doc.error) {
        setError(doc?.error || 'Document not found');
        setLoading(false);
        return;
      }

      try {
        // Store the raw content string directly for rendering
        const rawText = doc.content;
        setContent(rawText);
      } catch (e) {
        setError('Failed to load document content');
        console.error(e);
      }

      setLoading(false);
    }

    fetchDoc();
  }, [params.slug]);

  if (loading)
    return (
      <main>
        <Header />
        <div className="p-8">Loading system doc...</div>
      </main>
    );
  if (error)
    return (
      <main>
        <Header />
        <div className="p-8 text-red-500">Error: {error}</div>
      </main>
    );

  return (
    <main>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>System Document: {params.slug.join('/')}</h1>

        <div className={styles.viewer}>
          <div className={styles.codeBlock}>
            <RenderRawContent content={content} />
          </div>
        </div>
      </div>
    </main>
  );
}

function RenderRawContent({ content }: { content: string }) {
  // This function will render lines with gutter
  const lines = content.split('\n');

  return (
    <div className={styles.editor}>
      <div className={styles.gutter}>
        {lines.map((_, i) => (
          <div key={i} id={`L${i + 1}`} className={styles.lineNumber}>
            <a href={`#L${i + 1}`}>{i + 1}</a>
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
