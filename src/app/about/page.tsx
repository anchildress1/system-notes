import type { Metadata } from 'next';
import { getImageProps } from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiArrowUpRight, FiStar } from 'react-icons/fi';
import { AboutPageMotion } from '@/components/AboutPageMotion/AboutPageMotion';
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
    <AboutPageMotion className={styles.main}>
      <section className={styles.hero} aria-labelledby="about-heading">
        <div>
          <h1 id="about-heading" className="page-head-title">
            Forged between <span>coal and code.</span>
          </h1>
          <p className={styles.role}>
            {profile.role} · {profile.location}
          </p>
          <div className={styles.introduction}>
            <p>{profile.introduction[0]}</p>
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
        <div className={styles.personal}>
          <figure className={styles.portrait} data-about-tape>
            {/* Both portraits ship; CSS shows the one matching the theme, and lazy is what
              keeps the hidden one from downloading. preload, eager and fetchPriority were
              each measured here: every one traded load delay for render delay.

              No blur placeholder — Next draws it as an inline Gaussian-blur SVG, and two of
              them cost 145ms of FCP rasterising a picture about to be replaced. */}
            {(['dark', 'light'] as const).map((theme) => {
              const { props } = getImageProps({
                src: profile.portrait[theme],
                alt: profile.portrait.alt,
                fill: true,
                loading: 'lazy',
                sizes:
                  '(max-width: 55rem) min(31rem, calc(100vw - clamp(2rem, 6vw, 6rem) - 1rem)), min(25rem, calc(34.286vw - 1rem))',
              });

              return (
                <span key={theme} className={styles.portraitFrame} data-theme-image={theme}>
                  {/* getImageProps keeps Next's responsive loader without an image client component. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...props} alt={props.alt} />
                </span>
              );
            })}
            <figcaption>
              <span>Verified human</span>
              <span>Usually opinionated</span>
            </figcaption>
          </figure>
          <p className={styles.origin}>{profile.introduction[1]}</p>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-heading">
        <header>
          <h2 id="principles-heading">The rules are short on purpose.</h2>
        </header>
        <ol>
          {profile.principles.map((principle, index) => {
            const project = projects.find(({ id }) => id === principle.projectId);
            if (!project) throw new Error(`Missing principle exhibit: ${principle.projectId}`);

            return (
              <li key={principle.title} data-about-reading>
                <div className={styles.margin} aria-hidden="true">
                  <span
                    className={`${styles.annotation} ${index === 2 ? styles.strokeAnchor : ''}`}
                    data-about-scene
                  >
                    <span
                      className={index === 2 ? styles.principleStroke : styles.principleTape}
                      data-about-motion
                    />
                  </span>
                  <span className={styles.principleNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className={styles.principleCopy}>
                  <h3>{principle.title}</h3>
                  <p>{principle.body}</p>
                  <Link className={styles.principleEvidence} href={`/projects#${project.id}`}>
                    {project.title} <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
        <div className={styles.conclusion} data-about-reading>
          <p>
            {profile.principlesConclusion.lead}{' '}
            <span className={styles.human}>
              {profile.principlesConclusion.emphasis}
              <span className={styles.judgmentAnchor} data-about-scene aria-hidden="true">
                <span className={styles.judgmentStroke} data-about-motion />
              </span>
            </span>
          </p>
        </div>
      </section>

      <section className={styles.themeSong} aria-labelledby="theme-song-heading">
        <header>
          {/* No artist line: the status beside the control already names them,
              and the design does not repeat it under the heading. */}
          <h2 id="theme-song-heading">Theme song: &ldquo;{profile.themeSong.track}&rdquo;</h2>
        </header>
        <div data-about-scene>
          <div className={styles.songPlayer} data-about-motion>
            <ThemeSong />
          </div>
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

      <section className={styles.proof} aria-labelledby="proof-heading">
        <header>
          <h2 id="proof-heading">Claims should have receipts.</h2>
        </header>
        <dl>
          <div data-about-scene>
            <dt>Projects documented</dt>
            <dd className={styles.receiptCount} data-about-motion>
              {projects.length}
              <span className={styles.receiptStroke} data-about-motion aria-hidden="true" />
            </dd>
          </div>
          <div data-about-scene>
            <dt>Currently active</dt>
            <dd className={styles.receiptCount} data-about-motion>
              {groups.current.length}
              <span className={styles.receiptStroke} data-about-motion aria-hidden="true" />
            </dd>
          </div>
          <div data-about-scene>
            <dt>Recorded awards</dt>
            <dd className={styles.receiptCount} data-about-motion>
              {awardedProjects.length}
              <span className={styles.receiptStroke} data-about-motion aria-hidden="true" />
            </dd>
          </div>
        </dl>
        {/* Two record lists under one h2, so each needs naming. aria-labelledby rather than
            a repeated aria-label: a heading beside a list does not name it on its own. */}
        {awardedProjects.length > 0 ? (
          <div className={styles.awards}>
            <h3 id="awards-label" className={styles.recordLabel}>
              Awards
            </h3>
            <ul className={styles.records} aria-labelledby="awards-label">
              {awardedProjects.map((project) => (
                <li key={project.id} data-about-scene>
                  {/* Awards land on their exhibit in the catalogue, not a hidden reader state. */}
                  <Link
                    className={styles.record}
                    href={`/projects#${encodeURIComponent(project.id)}`}
                  >
                    <span className={styles.recordBadge} data-about-motion>
                      {project.award}
                      <FiStar aria-hidden="true" />
                    </span>
                    <span className={styles.recordLine}>
                      {project.title}
                      <span className={styles.recordGo} aria-hidden="true">
                        <FiArrowRight />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.certifications}>
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
                      <FiArrowUpRight />
                    </span>
                  </span>
                  <span className={styles.credentialMeta}>
                    {certification.issuer} · {certification.issued}
                  </span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading" data-about-reading>
        <div className={styles.contactHeading}>
          <h2 id="contact-heading">Follow the work, not a funnel.</h2>
        </div>
        {/* Where the work is, not where the accounts are — the footer carries the profiles
            site-wide. */}
        <div data-about-scene>
          <nav aria-label="Where the work lives" className={styles.contactLinks} data-about-motion>
            <Link className="washed" href="/notes">
              Search the index{' '}
              <span className={styles.outbound} aria-hidden="true">
                <FiArrowRight />
              </span>
            </Link>
            <Link className="washed" href="/projects">
              See what I&rsquo;ve shipped{' '}
              <span className={styles.outbound} aria-hidden="true">
                <FiArrowRight />
              </span>
            </Link>
            <a className="washed" href={BLOG_URL} target="_blank" rel="noopener noreferrer">
              Read the blog{' '}
              <span className={styles.outbound} aria-hidden="true">
                <FiArrowUpRight />
              </span>
            </a>
            <a className="washed" href={`mailto:${profile.email}`}>
              Or just email me <span className={styles.reachAddress}>{profile.email}</span>
            </a>
          </nav>
        </div>
      </section>
    </AboutPageMotion>
  );
}
