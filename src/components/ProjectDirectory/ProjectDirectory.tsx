import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import rawExhibits from '@/data/exhibits.json';
import type { Project } from '@/lib/api';
import { blurFor } from '@/lib/imageVariants';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

type ExhibitCopy = {
  readonly id: string;
  readonly standard: string;
  readonly evidence: string;
};

/* Beside the list they count, not in the page that renders them. */
export const EXHIBIT_DECK = 'Seven exhibits in AI, backend systems, and guardrail work.';
export const EXHIBIT_SUMMARY = `${EXHIBIT_DECK} Each one shows its evidence and failure boundary.`;

export const EXHIBITS: readonly ExhibitCopy[] = rawExhibits;

function evidenceLinks(project: Project) {
  return [
    project.app_url
      ? {
          label:
            project.app_url.startsWith('https://github.com/') &&
            project.app_url.includes('/releases')
              ? 'Release'
              : 'Live site',
          href: project.app_url,
        }
      : null,
    project.repo_url ? { label: 'Repository', href: project.repo_url } : null,
    ...project.blog_posts.map((post) => ({ label: 'Writing', href: post.url })),
    // Filed apart from the writing: someone else announcing a win is evidence for
    // the award, not an account of how the thing was built.
    ...project.announcements.map((post) => ({ label: 'Receipt', href: post.url })),
  ].filter((link): link is { label: string; href: string } => link !== null);
}

export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const exhibits = EXHIBITS.flatMap((copy) => {
    const project = projectsById.get(copy.id);
    return project ? [{ copy, project }] : [];
  });

  return (
    <section className={styles.catalogue} aria-label="Selected exhibits">
      {exhibits.map(({ copy, project }) => {
        const links = evidenceLinks(project);
        return (
          <article
            key={project.id}
            id={project.id}
            data-testid={`exhibit-${project.id}`}
            className={styles.exhibit}
          >
            <header className={styles.heading}>
              <h2>{project.title}</h2>
              {project.award ? <p className={styles.award}>{project.award}</p> : null}
            </header>

            {project.image_url ? (
              <figure className={`taped ${styles.media}`}>
                <Image
                  src={project.image_url}
                  alt={project.image_alt ?? ''}
                  width={896}
                  height={448}
                  sizes="(max-width: 48rem) 100vw, 48vw"
                  placeholder={blurFor(project.image_url) ? 'blur' : 'empty'}
                  blurDataURL={blurFor(project.image_url)}
                />
              </figure>
            ) : null}

            <div className={styles.copy}>
              <p className={styles.standard}>{copy.standard}</p>
              <p className={styles.evidence}>{copy.evidence}</p>
              <p className={styles.materials}>
                {project.tech
                  .slice(0, 3)
                  .map((item) => item.name)
                  .join(' · ')}
              </p>
            </div>

            <footer className={styles.references}>
              {links.map((link) => (
                <a
                  key={link.href}
                  className={`swiped ${styles.reference}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <FiArrowUpRight aria-hidden="true" />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ))}
              <Link
                className={`swiped ${styles.reference}`}
                href={getProjectNotesURL(project.title)}
              >
                Filed notes
                <FiArrowUpRight aria-hidden="true" />
              </Link>
            </footer>
          </article>
        );
      })}
    </section>
  );
}
