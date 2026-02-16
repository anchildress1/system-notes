'use client';

import Header from '@/components/Header/Header';
import Image from 'next/image';
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
      <Hero title={heroTitle.trim()} subtitle={heroSubtitle?.trim()} />

      <div className={styles.profileImageWrapper}>
        <Image
          src={aboutData.heroImage.src}
          alt={aboutData.heroImage.alt}
          width={aboutData.heroImage.width}
          height={aboutData.heroImage.height}
          className={styles.profileImage}
          priority
          sizes="(max-width: 768px) 100vw, 450px"
        />
      </div>

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
