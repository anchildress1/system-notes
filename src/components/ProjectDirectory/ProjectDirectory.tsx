'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Project } from '@/lib/api';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

/** Exhibits shown before the archive is opened. */
export const HIGHLIGHT_COUNT = 6;

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

/**
 * Turns a project's status into the register the page argues in.
 *
 * @param status Status as the registry records it, e.g. `Active · Deployed`.
 * @returns A short phrase for the exhibit's stamp.
 */
export function exhibitStamp(status: string | undefined): string {
  const head = (status ?? '').split('·')[0]?.trim().toLowerCase();
  if (head === 'scrapped') return 'falsified on purpose';
  if (head === 'retired') return 'retired';
  if (head === 'archived') return 'archived';
  return 'in evidence';
}

/** Organic corner shapes, cycled so no two neighbours share one. */
const BLOBS = [
  '58% 42% 46% 54% / 44% 52% 48% 56%',
  '44% 56% 60% 40% / 56% 44% 56% 44%',
  '52% 48% 40% 60% / 48% 58% 42% 52%',
  '46% 54% 52% 48% / 60% 40% 60% 40%',
] as const;

/**
 * Reveals each exhibit as it scrolls in.
 *
 * @returns A ref callback to attach to every revealable element.
 */
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Anyone who asked for less motion gets the page already revealed, so the
    // content never depends on an animation they opted out of.
    const stillness = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (stillness?.matches || typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', 'true');
          observerRef.current?.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  return useCallback((node: HTMLElement | null) => {
    if (!node) return;
    // Without an observer — reduced motion, or no support — the element is
    // revealed outright rather than left at zero opacity forever.
    if (!observerRef.current) {
      node.setAttribute('data-revealed', 'true');
      return;
    }
    observerRef.current.observe(node);
  }, []);
}

export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  const [showAll, setShowAll] = useState(false);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const reveal = useScrollReveal();

  const shown = showAll ? projects : projects.slice(0, HIGHLIGHT_COUNT);
  const archived = Math.max(0, projects.length - HIGHLIGHT_COUNT);

  return (
    <>
      <ol className={styles.exhibits}>
        {shown.map((project, index) => {
          const isOpen = Boolean(opened[project.id]);
          const detailId = `exhibit-${project.id}-detail`;
          const links = [
            project.app_url ? { label: 'launch', href: project.app_url } : null,
            project.repo_url ? { label: 'repo', href: project.repo_url } : null,
          ].filter((link): link is { label: string; href: string } => link !== null);
          const posts = project.blog_posts ?? [];

          return (
            <li key={project.id}>
              <article
                ref={reveal}
                className={styles.exhibit}
                data-flip={index % 2 === 1 || undefined}
                data-testid={`project-${project.id}`}
              >
                <div className={styles.exhibitText}>
                  <p className={styles.exhibitMeta}>
                    <span className={styles.exhibitLetter}>{exhibitLabel(index)}</span>
                    <span>{exhibitStamp(project.status)}</span>
                    <span aria-hidden="true" className={styles.metaDash}>
                      —
                    </span>
                    <span>{project.status || 'status unavailable'}</span>
                  </p>

                  <h2>{project.title}</h2>
                  <p className={styles.exhibitWhat}>{project.description}</p>
                  {project.purpose ? (
                    <p className={styles.exhibitPurpose}>{project.purpose}</p>
                  ) : null}

                  {project.award ? (
                    <p className={styles.exhibitAward}>
                      <span aria-hidden="true">★</span>
                      {project.award}
                    </p>
                  ) : null}

                  {project.tech.length > 0 ? (
                    <ul className={styles.stack} aria-label={`${project.title} stack`}>
                      {project.tech.map((item) => (
                        <li key={`${item.name}-${item.role}`}>{item.name}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className={styles.exhibitActions}>
                    <button
                      type="button"
                      className={styles.argue}
                      aria-expanded={isOpen}
                      aria-controls={detailId}
                      onClick={() =>
                        setOpened((current) => ({ ...current, [project.id]: !current[project.id] }))
                      }
                    >
                      {isOpen ? 'close the argument' : 'read the argument'}
                    </button>
                    {links.map((link) => (
                      <a
                        key={link.href}
                        className={styles.exhibitLink}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label} <FiArrowUpRight aria-hidden="true" />
                        <span className="visually-hidden">
                          {' '}
                          — {project.title} (opens in a new tab)
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {project.image_url ? (
                  <div className={styles.exhibitMedia}>
                    <span aria-hidden="true" className={styles.mediaGlow} />
                    <Image
                      src={project.image_url}
                      alt={project.image_alt || `${project.title} project preview`}
                      width={768}
                      height={576}
                      loading="lazy"
                      style={{ borderRadius: BLOBS[index % BLOBS.length] }}
                    />
                  </div>
                ) : null}

                {isOpen ? (
                  <div id={detailId} className={styles.exhibitDetail}>
                    {project.long_description ? (
                      <div>
                        <h3>How it&apos;s built</h3>
                        <p>{project.long_description}</p>
                      </div>
                    ) : null}
                    <div>
                      {project.outcome ? (
                        <>
                          <h3>Outcome</h3>
                          <p>{project.outcome}</p>
                        </>
                      ) : null}
                      <p className={styles.detailCards}>
                        <a href={getProjectNotesURL(project.title)}>
                          cards filed under this exhibit <span aria-hidden="true">→</span>
                        </a>
                      </p>
                      {posts.length > 0 ? (
                        <ul className={styles.postList}>
                          {posts.map((post) => (
                            <li key={post.url}>
                              <a href={post.url} target="_blank" rel="noopener noreferrer">
                                {post.title} <FiArrowUpRight aria-hidden="true" />
                                <span className="visually-hidden"> (opens in a new tab)</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>

      {archived > 0 ? (
        <section className={styles.archive}>
          <button
            type="button"
            className={styles.archiveToggle}
            aria-expanded={showAll}
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? 'show only the highlights' : `show all ${projects.length} exhibits`}
          </button>
          <p aria-live="polite" className={styles.archiveCount}>
            {showAll
              ? 'Showing everything — active, retired, and falsified.'
              : `${archived} more in the archive, including the ones that failed on purpose.`}
          </p>
        </section>
      ) : null}
    </>
  );
}
