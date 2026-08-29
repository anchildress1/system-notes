import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ThemeSong from '@/components/ThemeSong/ThemeSong';
import { BLOG_URL } from '@/config';
import { blurFor } from '@/lib/imageVariants';
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
        </div>
        <figure className={`drift ${styles.portrait}`}>
          {/* Both portraits ship; CSS shows the one matching the theme. They are
              lazy rather than priority on purpose: a display:none image is never
              in the viewport, so the browser fetches only the visible one. A
              priority hint would preload both and spend the second download on a
              picture nobody is looking at. */}
          {(['dark', 'light'] as const).map((theme) => (
            <span key={theme} className={styles.portraitFrame} data-theme-image={theme}>
              <Image
                src={profile.portrait[theme]}
                alt={profile.portrait.alt}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={blurFor(profile.portrait[theme])}
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
        {/* Two record lists under one h2, so each needs naming. The label takes
            the fine print the figures' own labels are set in rather than a
            second display heading, which would compete with the h2 that already
            runs past its column. aria-labelledby rather than a repeated
            aria-label: a heading beside a list does not name it on its own. */}
        {awardedProjects.length > 0 ? (
          <div className={styles.recordGroup}>
            <h3 id="awards-label" className={styles.recordLabel}>
              Awards
            </h3>
            <ul className={styles.records} aria-labelledby="awards-label">
              {awardedProjects.map((project) => (
                <li key={project.id}>
                  {/* The whole record is the link, and it goes to the exhibit that
                      holds the evidence — a win named with nowhere to check it is
                      the claim this section exists to stop making. */}
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
          {/* Set as footnotes, not as records. A win is a hero line and takes
              the band; a certification is a filed fact, so it takes the same
              serif-over-small-caps pair the exhibits set their stack in and
              flows in columns rather than stacking. Three two-line award
              records followed by two more of them made this the tallest
              section on the site and the least like the rest of it. */}
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
        {/* Label left, content right — the same two columns as every other
            section here. It used to be the one section that ran full width from
            the far edge, which left the right half of the page empty and made it
            read as a different page grafted in. */}
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
        {/* Where the work is, not where the accounts are. This listed the same
            four profiles the site footer carries, directly above the site
            footer carrying them — two near-identical rows at the bottom of one
            page. The footer keeps that row for every route; this section does
            the thing its heading promises instead.

            Internal destinations take the stepping arrow and the one that
            leaves takes the outbound one, which is the same distinction the
            record lists above draw. */}
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
        </nav>
      </section>
    </main>
  );
}
