import Image from 'next/image';
import type { AboutData } from '@/data/about';
import styles from './AboutContent.module.css';

// Splits on *text* markers, alternating between plain strings and <em> nodes.
// Requires non-whitespace at both boundaries (\S) so *foo bar* works but
// a lone * or a trailing space before * doesn't create unintended wrapping.
function parseEmphasis(text: string) {
  return text
    .split(/\*(\S[^*]*\S|\S)\*/)
    .map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part));
}

const TextContent = ({ text }: { text: string }) => (
  <>
    {text.split('\n\n').map((paragraph, i) => (
      <p key={i}>{parseEmphasis(paragraph.trim())}</p>
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
