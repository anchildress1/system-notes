import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header/Header';
import styles from './page.module.css';
import AboutHero from '@/components/AboutHero/AboutHero';
import { API_URL } from '@/config';

export default function About() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await fetch(`${API_URL}/about`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        } else {
          console.error('Failed to fetch about content');
          setContent('Failed to load content.');
        }
      } catch (error) {
        console.error('Error loading about content:', error);
        setContent('Error loading content.');
      } finally {
        setLoading(false);
      }
    };

    fetchAbout();
  }, []);

  return (
    <main>
      <Header />
      <AboutHero />
      <div className={styles.container}>
        <div className={styles.content}>
          {loading ? <p>Loading...</p> : <ReactMarkdown>{content}</ReactMarkdown>}
        </div>
      </div>
    </main>
  );
}
