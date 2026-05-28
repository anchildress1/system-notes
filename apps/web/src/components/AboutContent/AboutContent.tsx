import Image from 'next/image';
import type { AboutData } from '@/data/about';
import styles from './AboutContent.module.css';

const TextContent = ({ text }: { text: string }) => (
  <>
    {text.split('\n\n').map((paragraph) => (
      <p key={paragraph.slice(0, 40)}>{paragraph.trim()}</p>
    ))}
  </>
);

const sectionNumber = (index: number) => String(index + 1).padStart(2, '0');

interface AboutContentProps {
  data: AboutData;
}

export default function AboutContent({ data }: Readonly<AboutContentProps>) {
  const { heroImage, sections } = data;

  return (
    <div className={styles.human}>
      <div className={styles.portrait}>
        <span className={styles.portraitGrid} aria-hidden="true" />
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          width={heroImage.width}
          height={heroImage.height}
          className={styles.portraitImage}
          priority
          sizes="(max-width: 768px) 100vw, 460px"
        />
        <span className={styles.portraitMeta} aria-hidden="true">
          <span>SUBJECT · 026</span>
          <span>YEAR · 2026</span>
        </span>
      </div>

      {sections.map((section, index) => {
        const TitleTag = index === 0 ? 'h1' : 'h2';
        return (
          <section key={section.title} className={styles.section}>
            <div className={styles.sectionMeta}>
              <span className={styles.sectionNum}>{sectionNumber(index)} · NODE</span>
              <TitleTag className={styles.sectionTitle}>{section.title}</TitleTag>
              {section.subtitle && <span className={styles.sectionTag}>{section.subtitle}</span>}
            </div>
            <div className={styles.sectionBody}>
              <TextContent text={section.content} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
