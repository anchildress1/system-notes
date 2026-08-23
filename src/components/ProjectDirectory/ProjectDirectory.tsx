'use client';

import { useId, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Project } from '@/lib/api';
import { blurFor } from '@/lib/imageVariants';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

/**
 * Reduces a raw status to the word the rail shows.
 *
 * @param status The project's status string, which may carry a qualifier.
 * @returns A single lowercase word.
 */
export function exhibitStamp(status: string | undefined): string {
  const value = (status ?? '').toLowerCase();
  if (value.includes('scrapped')) return 'falsified on purpose';
  if (value.includes('retired')) return 'retired';
  if (value.includes('archived')) return 'archived';
  return 'in evidence';
}

/**
 * The systems rail and the detail pane beside it.
 *
 * Selection is local. The rail is a list of links to nothing — the page holds
 * every project already, so moving between them is a state change rather than a
 * navigation, and nothing here writes to the URL.
 */
export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  const [selectedId, setSelectedId] = useState(projects[0]?.id);
  const panelId = useId();

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId]
  );

  if (!selected) return null;

  const links = [
    selected.app_url ? { label: 'Live app', href: selected.app_url } : null,
    selected.repo_url ? { label: 'Repo', href: selected.repo_url } : null,
    ...(selected.blog_posts ?? []).map((post) => ({ label: 'Write-up', href: post.url })),
  ].filter((link): link is { label: string; href: string } => link !== null);

  return (
    <div className={styles.corpus}>
      <nav className={styles.rail} aria-label="Systems">
        <ul>
          {projects.map((project) => {
            const current = project.id === selected.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  className={styles.railItem}
                  aria-current={current ? 'true' : undefined}
                  aria-controls={panelId}
                  data-testid={`project-${project.id}`}
                  onClick={() => setSelectedId(project.id)}
                >
                  <span aria-hidden="true" className={styles.railMark} />
                  <span className={styles.railText}>
                    <span className={styles.railName}>
                      {project.title}
                      {project.award ? (
                        <span className={styles.railStar} aria-hidden="true">
                          ★
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.railStatus}>{exhibitStamp(project.status)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Keyed on the selection so the pane remounts: without it the scroll
          position and the image both carry over from the previous system. */}
      <article key={selected.id} className={styles.detail} id={panelId} aria-live="polite">
        {selected.award ? (
          <p className={styles.award}>
            {selected.award}
            <span aria-hidden="true"> ★</span>
          </p>
        ) : null}
        <p className={styles.status}>{selected.status}</p>
        <h2 className={styles.name}>{selected.title}</h2>
        <p className={styles.purpose}>{selected.purpose}</p>

        {selected.image_url ? (
          <span className={styles.media}>
            <Image
              src={selected.image_url}
              alt={selected.image_alt ?? ''}
              width={896}
              height={448}
              sizes="(max-width: 60rem) 100vw, 56vw"
              placeholder={blurFor(selected.image_url) ? 'blur' : 'empty'}
              blurDataURL={blurFor(selected.image_url)}
              className={styles.image}
            />
          </span>
        ) : null}

        <div className={styles.columns}>
          <div className={styles.prose}>
            <p>{selected.long_description}</p>
            <h3>Outcome</h3>
            <p>{selected.outcome}</p>
            <div className={styles.actions}>
              {links.map((link) => (
                <a
                  key={link.href}
                  className={styles.action}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <FiArrowUpRight aria-hidden="true" />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ))}
              <Link className={styles.crossLink} href={getProjectNotesURL(selected.title)}>
                Decisions from {selected.title}
              </Link>
            </div>
          </div>

          <div className={styles.stackColumn}>
            <h3>Stack</h3>
            <dl className={styles.stack}>
              {selected.tech.map((item) => (
                <div key={item.name}>
                  <dt>{item.name}</dt>
                  <dd>{item.role}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </article>
    </div>
  );
}
