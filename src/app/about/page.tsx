import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
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
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>About · {profile.name}</p>
          <h1 id="about-heading">
            Forged between <em>coal and code.</em>
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
        <figure className={styles.portrait}>
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

      <section className={styles.proof} aria-labelledby="proof-heading">
        <header>
          <p>The record</p>
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

      <section className={styles.principles} aria-labelledby="principles-heading">
        <header>
          <p>How I work</p>
          <h2 id="principles-heading">The rules are short on purpose.</h2>
        </header>
        <ol>
          {profile.principles.map((principle, index) => (
            <li key={principle.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.themeSong} aria-labelledby="theme-song-heading">
        <header>
          <h2 id="theme-song-heading">
            Theme song: <cite>{profile.themeSong.track}</cite>
          </h2>
          <p className={styles.themeSongTrack}>{profile.themeSong.artist}</p>
        </header>
        <ThemeSong />
        <div className={styles.themeSongCopy}>
          {profile.themeSong.paragraphs.map((paragraph) => (
            <p key={paragraph.lead ?? paragraph.body}>
              {paragraph.lead ? <em>{paragraph.lead}</em> : null}
              {paragraph.lead && paragraph.body ? ' ' : null}
              {paragraph.body}
            </p>
          ))}
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="contact-heading">
        <div>
          <p>Elsewhere</p>
          <h2 id="contact-heading">Follow the work, not a funnel.</h2>
        </div>
        <nav aria-label="Ashley Childress profiles">
          {profile.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label} <FiArrowUpRight aria-hidden="true" />
            </a>
          ))}
          <Link href="/notes">
            Search the index <FiArrowUpRight aria-hidden="true" />
          </Link>
        </nav>
      </section>
    </main>
  );
}
