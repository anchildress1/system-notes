import Image from 'next/image';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Project } from '@/lib/api';
import { groupProjects, type ProjectBucket } from '@/lib/projectStatus';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

const groupCopy: Record<ProjectBucket, { id: string; title: string; description: string }> = {
  current: {
    id: 'current-projects',
    title: 'Current',
    description: 'Deployed, released, published, or still actively maintained.',
  },
  ended: {
    id: 'ended-projects',
    title: 'Ended',
    description: 'Retired, archived, or scrapped after the useful lesson arrived.',
  },
};

export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  const groups = groupProjects(projects);
  let projectNumber = 0;

  return (
    <div className={styles.directory}>
      {(Object.keys(groupCopy) as ProjectBucket[]).map((bucket) => {
        const copy = groupCopy[bucket];
        return (
          <section key={bucket} id={copy.id} className={styles.group}>
            <header className={styles.groupHeader}>
              <div>
                <h2>{copy.title}</h2>
                <p>{String(groups[bucket].length).padStart(2, '0')}</p>
              </div>
              <p>{copy.description}</p>
            </header>
            <ol className={styles.projectList}>
              {groups[bucket].map((project) => {
                projectNumber += 1;
                return (
                  <li key={project.id}>
                    <ProjectEntry project={project} number={projectNumber} />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ProjectEntry({ project, number }: Readonly<{ project: Project; number: number }>) {
  const actions = [
    project.app_url ? { label: 'Open app', href: project.app_url } : null,
    project.repo_url ? { label: 'View source', href: project.repo_url } : null,
    ...(project.blog_posts ?? []).map((post) => ({ label: post.title, href: post.url })),
  ].filter((action): action is { label: string; href: string } => action !== null);

  return (
    <details className={styles.project} data-testid={`project-${project.id}`}>
      <summary>
        <span className={styles.number}>{String(number).padStart(2, '0')}</span>
        <span className={styles.summaryTitle}>
          {project.title}
          {project.award ? (
            <span className={styles.summaryAward}>
              <span aria-hidden="true">★</span>
              <span className="visually-hidden">Award winner: {project.award}</span>
            </span>
          ) : null}
        </span>
        <span className={styles.summaryDescription}>{project.description}</span>
        <span className={styles.status}>{project.status || 'Status unavailable'}</span>
        <span className={styles.indicator} aria-hidden="true">
          +
        </span>
      </summary>
      <div className={styles.projectDetail}>
        <div className={styles.projectMedia}>
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.image_alt || `${project.title} project preview`}
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              {String(number).padStart(2, '0')}
            </div>
          )}
        </div>
        <div className={styles.projectNarrative}>
          {project.award ? <p className={styles.award}>{project.award}</p> : null}
          <h3>{project.description}</h3>
          {project.long_description ? (
            <p className={styles.longDescription}>{project.long_description}</p>
          ) : null}
          {project.purpose ? (
            <section>
              <h4>Why it exists</h4>
              <p>{project.purpose}</p>
            </section>
          ) : null}
          {project.outcome ? (
            <section>
              <h4>Outcome</h4>
              <p>{project.outcome}</p>
            </section>
          ) : null}
          {project.tech.length > 0 ? (
            <section>
              <h4>Technology</h4>
              <ul className={styles.techList}>
                {project.tech.map((item) => (
                  <li key={`${item.name}-${item.role}`}>
                    <span>{item.name}</span>
                    <small>{item.role}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <nav className={styles.projectActions} aria-label={`${project.title} links`}>
            <a href={getProjectNotesURL(project.title)}>
              Search this project in the index <FiArrowUpRight aria-hidden="true" />
            </a>
            {actions.map((action) => (
              <a
                key={`${action.label}-${action.href}`}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {action.label} <FiArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </details>
  );
}
