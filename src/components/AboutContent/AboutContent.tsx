import Portrait from '@/components/Portrait/Portrait';
import Tag from '@/components/Tag/Tag';
import Button from '@/components/Button/Button';
import { GitHubIcon, DevIcon } from '@/components/icons';
import { FaLinkedin } from 'react-icons/fa';
import type { AboutData } from '@/data/about';
import styles from './AboutContent.module.css';

const LINK_ICONS = { github: GitHubIcon, dev: DevIcon, linkedin: FaLinkedin };

// Splits on *text* markers, alternating between plain strings and <em> nodes.
// Requires non-whitespace at both boundaries (\S) so *foo bar* works but
// a lone * or a trailing space before * doesn't create unintended wrapping.
function parseEmphasis(text: string) {
  return text
    .split(/\*(\S[^*]*\S|\S)\*/)
    .map((part, i) => (i % 2 === 1 ? <em key={`em-${part}`}>{part}</em> : part));
}

const TextContent = ({ text }: { text: string }) => (
  <>
    {text.split('\n\n').map((paragraph) => (
      <p key={paragraph}>{parseEmphasis(paragraph.trim())}</p>
    ))}
  </>
);

const sectionNumber = (index: number) => String(index + 1).padStart(2, '0');

interface AboutContentProps {
  data: AboutData;
}

export default function AboutContent({ data }: Readonly<AboutContentProps>) {
  const { sections, skillGroups, recognition, links, stats, heroImage } = data;

  return (
    <div className={styles.human}>
      <div className={styles.intro}>
        <Portrait
          src={heroImage.src}
          alt={heroImage.alt}
          width={heroImage.width}
          height={heroImage.height}
        />

        <section className={styles.highlights} aria-label="Highlights">
          <span className={styles.nodeLabel}>00 · NODE</span>

          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.hlCols}>
            <div className={styles.hlCol}>
              {skillGroups.map((group) => (
                <div key={group.label} className={styles.hlGroup}>
                  <span className={styles.hlLabel}>{group.label}</span>
                  <div className={styles.skills}>
                    {group.items.map((skill) => (
                      <Tag key={skill}>{skill}</Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.hlCol}>
              <div className={styles.hlGroup}>
                <span className={styles.hlLabel}>Recognition</span>
                <ul className={styles.recognition}>
                  {recognition.map((item) => (
                    <li key={item} className={styles.recognitionItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.links}>
                {links.map((link) => {
                  const Icon = link.icon ? LINK_ICONS[link.icon] : null;
                  return (
                    <Button
                      key={link.href}
                      variant="secondary"
                      size="sm"
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      icon={Icon ? <Icon /> : undefined}
                      className={styles.linksButton}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {sections.map((section, index) => (
        <section className={styles.section} key={section.title}>
          <div className={styles.sectionMeta}>
            <span className={styles.sectionNum}>{sectionNumber(index)} · NODE</span>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            {section.subtitle && <span className={styles.sectionTag}>{section.subtitle}</span>}
          </div>
          <div className={styles.sectionBody}>
            <TextContent text={section.content} />
          </div>
        </section>
      ))}
    </div>
  );
}
