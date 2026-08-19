import Image from 'next/image';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Project } from '@/lib/api';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

/**
 * Letters an exhibit can carry. Twenty projects fit inside the alphabet, so a
 * exhibit is lettered rather than numbered — the register the page argues in.
 */
const EXHIBIT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Names an exhibit by position.
 *
 * @param index Zero-based position in the directory.
 * @returns The exhibit letter, or a 1-based number once the alphabet runs out.
 */
export function exhibitLabel(index: number): string {
  return EXHIBIT_LETTERS[index] ?? String(index + 1);
}

/** Award badges tilt, alternating direction so the column does not read ruled. */
function badgeTilt(index: number): string {
  const angles = ['-2deg', '2deg', '-1.5deg', '1.5deg'];
  return angles[index % angles.length]!;
}

export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  return (
    <ol className={styles.exhibits}>
      {projects.map((project, index) => (
        <li key={project.id}>
          <Exhibit project={project} index={index} />
        </li>
      ))}
    </ol>
  );
}

function Exhibit({ project, index }: Readonly<{ project: Project; index: number }>) {
  const label = exhibitLabel(index);
  const links = [
    project.app_url ? { label: 'launch', href: project.app_url } : null,
    project.repo_url ? { label: 'repo', href: project.repo_url } : null,
    ...(project.blog_posts ?? []).map((post) => ({ label: post.title, href: post.url })),
  ].filter((link): link is { label: string; href: string } => link !== null);

  const summary = project.long_description || project.description;
  const hasEvidence = Boolean(project.purpose || project.outcome || project.image_url);

  return (
    <article className={styles.exhibit} data-testid={`project-${project.id}`}>
      <div className={styles.exhibitMeta}>
        <p className={styles.exhibitLabel}>Exhibit {label}</p>
        <p className={styles.exhibitStatus}>{project.status || 'Status unavailable'}</p>
        {project.award ? (
          <p className={styles.exhibitAward} style={{ rotate: badgeTilt(index) }}>
            <span aria-hidden="true">★ </span>
            {project.award}
          </p>
        ) : null}
      </div>

      <div className={styles.exhibitBody}>
        <h2>{project.title}</h2>
        <p className={styles.exhibitSummary}>{summary}</p>

        {project.tech.length > 0 ? (
          <ul className={styles.stack} aria-label={`${project.title} stack`}>
            {project.tech.map((item) => (
              <li key={`${item.name}-${item.role}`}>{item.name}</li>
            ))}
          </ul>
        ) : null}

        <nav className={styles.exhibitLinks} aria-label={`${project.title} links`}>
          {links.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label} <FiArrowUpRight aria-hidden="true" />
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ))}
          <a className={styles.filedLink} href={getProjectNotesURL(project.title)}>
            cards filed under this exhibit <span aria-hidden="true">→</span>
          </a>
        </nav>

        {/* The design's exhibit stops at the summary. The deeper evidence is
            kept behind a disclosure rather than dropped, so the page reads as
            the spec draws it without discarding what each project proved. */}
        {hasEvidence ? (
          <details className={styles.evidence}>
            <summary>
              evidence
              <span aria-hidden="true" className={styles.indicator}>
                +
              </span>
            </summary>
            <div className={styles.evidenceBody}>
              {project.image_url ? (
                <div className={styles.evidenceMedia}>
                  <Image
                    src={project.image_url}
                    alt={project.image_alt || `${project.title} project preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                  />
                </div>
              ) : null}
              <div className={styles.evidenceCopy}>
                {project.purpose ? (
                  <section>
                    <h3>Why it exists</h3>
                    <p>{project.purpose}</p>
                  </section>
                ) : null}
                {project.outcome ? (
                  <section>
                    <h3>Outcome</h3>
                    <p>{project.outcome}</p>
                  </section>
                ) : null}
              </div>
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}
