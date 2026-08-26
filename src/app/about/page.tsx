import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ThemeSong from '@/components/ThemeSong/ThemeSong';
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
        {awardedProjects.length > 0 ? (
          <ul className={styles.awards} aria-label="Recorded project awards">
            {awardedProjects.map((project) => (
              <li key={project.id}>
                <span>{project.title}</span>
                <span>{project.award}</span>
              </li>
            ))}
          </ul>
        ) : null}
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
          <h2 id="theme-song-heading">
            Theme song: &ldquo;{profile.themeSong.track}&rdquo;
            {profile.themeSong.explicit ? (
              <>
                {' '}
                <span className={styles.explicit}>
                  <span aria-hidden="true">E</span>
                  <span className="visually-hidden">Explicit lyrics</span>
                </span>
              </>
            ) : null}
          </h2>
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
        <nav aria-label="Ashley Childress profiles">
          {profile.links.map((link) => (
            <a
              key={link.href}
              className="washed"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}{' '}
              <span className={styles.outbound} aria-hidden="true">
                &#8599;
              </span>
            </a>
          ))}
          <Link className="washed" href="/notes">
            Search the index{' '}
            <span className={styles.outbound} aria-hidden="true">
              &#8599;
            </span>
          </Link>
        </nav>
      </section>
    </main>
  );
}
