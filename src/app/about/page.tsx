import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ThemeSong from '@/components/ThemeSong/ThemeSong';
import { BLOG_URL } from '@/config';
import { profile } from '@/data/profile';
import { getProjects } from '@/lib/api';
import { groupProjects } from '@/lib/projectStatus';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

const pageTitle = "About | Ashley's System Notes";
const pageDescription =
  'Ashley Childress is a senior software engineer focused on systems architecture, AI orchestration, and failure-tested delivery.';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: '/about',
  type: 'profile',
});

export default function AboutPage() {
  const projects = getProjects();
  const groups = groupProjects(projects);
  const awardedProjects = projects.filter((project) => project.award);
  const { since } = profile.trackRecord;

  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.hero} aria-labelledby="about-heading">
        {/* Outside .heroCopy so the rule spans both columns. Inside the left
            column it stopped at the portrait's edge, so this page's head rule
            was the only one on the site narrower than the rules beneath it. */}
        <div className={styles.heroCopy}>
          <h1 id="about-heading" className="page-head-title">
            Forged between <span>coal and code.</span>
          </h1>
          <p className={styles.role}>
            {profile.role} · {profile.location}
          </p>
          <div className={styles.introduction}>
            {profile.introduction.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {/* In the hero: a reader screening for a role gives up before the fourth section. */}
          <dl className={styles.trackRecord}>
            <div>
              <dt>Practice</dt>
              <dd>
                {profile.trackRecord.core.join(' · ')}
                <span className={styles.since}>Shipping production systems since {since}</span>
              </dd>
            </div>
            <div>
              <dt>Also shipped</dt>
              <dd>{profile.trackRecord.applied.join(' · ')}</dd>
            </div>
          </dl>
        </div>
        <figure className={`drift ${styles.portrait}`}>
          {/* Both portraits ship; CSS shows the one matching the theme, and lazy is what
              keeps the hidden one from downloading. preload, eager and fetchPriority were
              each measured here: every one traded load delay for render delay.

              No blur placeholder — Next draws it as an inline Gaussian-blur SVG, and two of
              them cost 145ms of FCP rasterising a picture about to be replaced. */}
          {(['dark', 'light'] as const).map((theme) => (
            <span key={theme} className={styles.portraitFrame} data-theme-image={theme}>
              <Image
                src={profile.portrait[theme]}
                alt={profile.portrait.alt}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 36vw"
              />
            </span>
          ))}
          <figcaption>
            <span>Verified human</span>
            <span>Usually opinionated</span>
          </figcaption>
        </figure>
      </section>

      <section className={`reveal ${styles.proof}`} aria-labelledby="proof-heading">
        <header>
          <h2 id="proof-heading">Claims should have receipts.</h2>
        </header>
        <dl>
          <div>
            <dt>Projects documented</dt>
            <dd>{projects.length}</dd>
          </div>
          <div>
            <dt>Currently active</dt>
            <dd>{groups.current.length}</dd>
          </div>
          <div>
            <dt>Recorded awards</dt>
            <dd>{awardedProjects.length}</dd>
          </div>
        </dl>
        {/* Two record lists under one h2, so each needs naming. aria-labelledby rather than
            a repeated aria-label: a heading beside a list does not name it on its own. */}
        {awardedProjects.length > 0 ? (
          <div className={styles.recordGroup}>
            <h3 id="awards-label" className={styles.recordLabel}>
              Awards
            </h3>
            <ul className={styles.records} aria-labelledby="awards-label">
              {awardedProjects.map((project) => (
                <li key={project.id}>
                  {/* The whole record is the link, and it goes to the exhibit holding the evidence. */}
                  <Link
                    className={styles.record}
                    href={`/projects?system=${encodeURIComponent(project.id)}`}
                  >
                    <span className={styles.recordBadge}>
                      {project.award}
                      <span aria-hidden="true">★</span>
                    </span>
                    <span className={styles.recordLine}>
                      {project.title}
                      <span className={styles.recordGo} aria-hidden="true">
                        &#8594;
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.recordGroup}>
          <h3 id="certifications-label" className={styles.recordLabel}>
            Certifications
          </h3>
          <ul className={styles.credentials} aria-labelledby="certifications-label">
            {profile.certifications.map((certification) => (
              <li key={certification.credentialUrl}>
                <a
                  className={styles.credential}
                  href={certification.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.credentialName}>
                    {certification.name}
                    <span className={styles.credentialGo} aria-hidden="true">
                      &#8599;
                    </span>
                  </span>
                  <span className={styles.credentialMeta}>
                    {certification.issuer} · {certification.issued}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`reveal ${styles.principles}`} aria-labelledby="principles-heading">
        <header>
          <h2 id="principles-heading">The rules are short on purpose.</h2>
        </header>
        <ol>
          {profile.principles.map((principle, index) => (
            <li
              key={principle.title}
              className="stagger-in"
              style={{ '--i': index } as CSSProperties}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`reveal ${styles.themeSong}`} aria-labelledby="theme-song-heading">
        <header>
          {/* No artist line: the status beside the control already names them,
              and the design does not repeat it under the heading. */}
          <h2 id="theme-song-heading">Theme song: &ldquo;{profile.themeSong.track}&rdquo;</h2>
        </header>
        <div>
          <ThemeSong />
          <div className={styles.themeSongCopy}>
            {profile.themeSong.paragraphs.map((paragraph) => (
              <p key={paragraph.lead ?? paragraph.body}>
                {paragraph.lead ? <strong>{paragraph.lead}</strong> : null}
                {paragraph.lead && paragraph.body ? ' ' : null}
                {paragraph.body}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`reveal ${styles.contact}`} aria-labelledby="contact-heading">
        <div>
          <h2 id="contact-heading">Follow the work, not a funnel.</h2>
        </div>
        {/* Where the work is, not where the accounts are — the footer carries the profiles
            site-wide. */}
        <nav aria-label="Where the work lives">
          <Link className="washed" href="/notes">
            Search the index{' '}
            <span className={styles.outbound} aria-hidden="true">
              &#8594;
            </span>
          </Link>
          <Link className="washed" href="/projects">
            See what I&rsquo;ve shipped{' '}
            <span className={styles.outbound} aria-hidden="true">
              &#8594;
            </span>
          </Link>
          <a className="washed" href={BLOG_URL} target="_blank" rel="noopener noreferrer">
            Read the blog{' '}
            <span className={styles.outbound} aria-hidden="true">
              &#8599;
            </span>
          </a>
          <a className="washed" href={`mailto:${profile.email}`}>
            Or just email me <span className={styles.reachAddress}>{profile.email}</span>
          </a>
        </nav>
      </section>
    </main>
  );
}
