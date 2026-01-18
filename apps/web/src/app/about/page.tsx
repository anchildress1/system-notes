'use client';

import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header/Header';
import styles from './page.module.css';
import AboutHero from '@/components/AboutHero/AboutHero';
import aboutData from '@/data/about.json';

export default function About() {
  return (
    <main>
      <Header />
      <AboutHero title={aboutData.title} image={aboutData.image} />
      <div className={styles.container}>
        <div className={styles.content}>
          <ReactMarkdown>{aboutData.bio}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
