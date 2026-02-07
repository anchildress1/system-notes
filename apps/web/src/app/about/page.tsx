'use client';

import Header from '@/components/Header/Header';
import styles from './page.module.css';
import Hero from '@/components/Hero/Hero';
import { aboutData } from '@/data/about';

const TextContent = ({ text }: { text: string }) => (
  <>
    {text.split('\n\n').map((paragraph, i) => (
      <p key={i}>{paragraph.trim()}</p>
    ))}
  </>
);

export default function Human() {
  const [heroTitle, heroSubtitle] = aboutData.heroTitle.split('\n');

  return (
    <main id="main-content">
      <Header />
      <Hero title={heroTitle.trim()} subtitle={heroSubtitle?.trim()} image={aboutData.heroImage} />
      <div className={styles.container}>
        <div className={styles.content}>
          {aboutData.sections.map((section, index) => {
            const TitleTag = index === 0 ? 'h1' : 'h2';
            return (
              <div key={index} className={styles.section}>
                <TitleTag className={styles.name}>{section.title}</TitleTag>
                {section.subtitle && <span className={styles.subtitle}>{section.subtitle}</span>}
                <TextContent text={section.content} />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
