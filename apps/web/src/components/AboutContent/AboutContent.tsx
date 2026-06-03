import { Fragment } from 'react';
import Image from 'next/image';
import { FiExternalLink } from 'react-icons/fi';
import { FaArrowRight } from 'react-icons/fa';
import type { AboutData, AboutLyric } from '@/data/about';
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

const TONE_CLASS: Record<AboutLyric['rows'][number]['tone'], string> = {
  pink: styles.isPink,
  teal: styles.isTeal,
  violet: styles.isViolet,
  mute: styles.isMute,
};

const LyricLoud = ({ lyric }: { lyric: AboutLyric }) => (
  <div className={styles.lyricLoud}>
    <div className={styles.lyricMeta}>
      <span>{lyric.meta}</span>
      <span>{lyric.metaRight}</span>
    </div>
    <div className={styles.lyricRows}>
      {lyric.rows.map((row) => (
        <div key={row.text} className={`${styles.lyricRow} ${TONE_CLASS[row.tone]}`}>
          <span className={styles.lyricTime}>{row.time}</span>
          <span className={styles.lyricText}>{row.text}</span>
          <span className={styles.lyricTag}>[ {row.tag} ]</span>
        </div>
      ))}
    </div>
  </div>
);

interface AboutContentProps {
  data: AboutData;
}

export default function AboutContent({ data }: Readonly<AboutContentProps>) {
  const {
    heroImage,
    sections,
    name,
    namePath,
    role,
    specialty,
    pronounce,
    recognition,
    skills,
    links,
    stats,
    lyric,
  } = data;

  return (
    <div className={styles.human}>
      <div className={styles.heroRow}>
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

        <div className={styles.identity}>
          <span className={styles.namePath}>{namePath}</span>
          <p className={styles.name}>{name}</p>
          <p className={styles.role}>
            {role}
            <span className={styles.specialty}> · {specialty}</span>
          </p>
          <span className={styles.pronounce}>{pronounce}</span>

          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.links}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={styles.link}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
                {link.external ? (
                  <FiExternalLink aria-hidden="true" focusable="false" size={13} />
                ) : (
                  <FaArrowRight aria-hidden="true" focusable="false" size={11} />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      <section className={styles.expertise} aria-label="Expertise and recognition">
        <div className={styles.expertiseCol}>
          <span className={styles.expertiseLabel}>Expertise</span>
          <div className={styles.skills}>
            {skills.map((skill) => (
              <span key={skill} className={styles.skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.expertiseCol}>
          <span className={styles.expertiseLabel}>Recognition</span>
          <ul className={styles.recognition}>
            {recognition.map((item) => (
              <li key={item} className={styles.recognitionItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {sections.map((section, index) => (
        <Fragment key={section.title}>
          <section className={styles.section}>
            <div className={styles.sectionMeta}>
              <span className={styles.sectionNum}>{sectionNumber(index)} · NODE</span>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.subtitle && <span className={styles.sectionTag}>{section.subtitle}</span>}
            </div>
            <div className={styles.sectionBody}>
              <TextContent text={section.content} />
            </div>
          </section>
          {index === 0 && <LyricLoud lyric={lyric} />}
        </Fragment>
      ))}
    </div>
  );
}
