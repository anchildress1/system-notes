'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header/Header';
import AIChat from '@/components/AIChat/AIChat'; // Keep the chat available
import styles from './page.module.css';
import { API_URL } from '@/config';
import AboutHero from '@/components/AboutHero/AboutHero';

export default function About() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch(`${API_URL}/about`);
        if (!res.ok) throw new Error('Failed to load content');
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        console.error(err);
        setError('System error: Unable to retrieve identity file.');
      } finally {
        setLoading(false);
      }
    }

    fetchAbout();
  }, []);

  return (
    <main>
      <Header />
      <AboutHero />
      <div className={styles.container}>
        {loading && <div className={styles.loading}>Initializing identity protocol...</div>}

        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <div className={styles.content}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
      <AIChat />
    </main>
  );
}
