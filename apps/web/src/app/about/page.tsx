'use client';

import Header from '@/components/Header/Header';
import styles from './page.module.css';
import AboutHero from '@/components/AboutHero/AboutHero';
import { aboutData } from '@/data/about';

const TextContent = ({ text }: { text: string }) => (
  <>
    {text.split('\n\n').map((paragraph, i) => (
      <p key={i}>{paragraph.trim()}</p>
    ))}
  </>
);

export default function About() {
  return (
    <main>
      <Header />
      <AboutHero title={aboutData.heroTitle} image={aboutData.heroImage} />
      <div className={styles.container}>
        <div className={styles.content}>
          {aboutData.sections.map((section, index) => (
            <div key={index} className={styles.section}>
              <h2 className={styles.name}>{section.title}</h2>
              {section.subtitle && <span className={styles.subtitle}>{section.subtitle}</span>}
              <TextContent text={section.content} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
