'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Project } from '@/lib/api';
import { blurFor } from '@/lib/imageVariants';
import { getProjectNotesURL } from '@/lib/searchRouting';
import styles from './ProjectDirectory.module.css';

/** Opens one system directly: /projects?system=<id>. */
export const SYSTEM_PARAM = 'system';

/**
 * The system named in the URL when the page was opened.
 *
 * Read through a store rather than useSearchParams, which would opt this
 * statically rendered page out of static generation for a parameter only a deep
 * link ever carries. The snapshot is a primitive, so React can compare it
 * directly without a module cache that survives a client-side navigation.
 */
function subscribeToNothing(): () => void {
  return () => {};
}

function readLinkedSystem(): string | null {
  return new URLSearchParams(globalThis.location.search).get(SYSTEM_PARAM);
}

function noLinkedSystem(): string | null {
  return null;
}

function coverSubpixel(delta: number): number {
  return Math.sign(delta) * Math.ceil(Math.abs(delta));
}

/**
 * The systems rail and the detail pane beside it.
 *
 * Every project is already on the page, so moving between them is a state change
 * rather than a navigation. The URL trails that state instead of driving it, so
 * one system can be linked to without the rail becoming a set of routes.
 */

export default function ProjectDirectory({ projects }: Readonly<{ projects: Project[] }>) {
  const [chosen, setChosen] = useState<string | null>(null);
  const panelId = useId();
  const railRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const linked = useSyncExternalStore(subscribeToNothing, readLinkedSystem, noLinkedSystem);
  // A click wins over the link that opened the page; the link wins over the
  // default. An unknown id falls through to the first system rather than
  // rendering nothing.
  const selectedId =
    chosen ??
    (projects.some((project) => project.id === linked) ? linked : null) ??
    projects[0]?.id;

  // The URL follows the selection so the open system is always the one a copied
  // link reopens. replaceState keeps it out of history: the rail is one page.
  function select(id: string) {
    setChosen(id);
    const url = new URL(globalThis.location.href);
    url.searchParams.set(SYSTEM_PARAM, id);
    globalThis.history.replaceState(null, '', url);
  }

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId]
  );

  useEffect(() => {
    const rail = railRef.current;
    const activeItem = activeItemRef.current;
    if (!rail || !activeItem) return;
    const railBounds = rail.getBoundingClientRect();
    const itemBounds = activeItem.getBoundingClientRect();
    const visibleLeft = Math.max(railBounds.left, 0);
    const visibleRight = Math.min(railBounds.right, globalThis.innerWidth);
    const visibleTop = Math.max(railBounds.top, 0);
    const visibleBottom = Math.min(railBounds.bottom, globalThis.innerHeight);
    const left = coverSubpixel(
      visibleLeft >= visibleRight
        ? 0
        : itemBounds.left < visibleLeft
          ? itemBounds.left - visibleLeft
          : Math.max(0, itemBounds.right - visibleRight)
    );
    const top = coverSubpixel(
      visibleTop >= visibleBottom
        ? 0
        : itemBounds.top < visibleTop
          ? itemBounds.top - visibleTop
          : Math.max(0, itemBounds.bottom - visibleBottom)
    );
    if (left === 0 && top === 0) return;
    rail.scrollTo({ left: rail.scrollLeft + left, top: rail.scrollTop + top });
  }, [selected?.id]);

  if (!selected) return null;

  const links = [
    selected.app_url ? { label: 'Live app', href: selected.app_url } : null,
    selected.repo_url ? { label: 'Repo', href: selected.repo_url } : null,
    ...(selected.blog_posts ?? []).map((post) => ({ label: 'Write-up', href: post.url })),
    // Labelled apart from the write-ups: someone else announcing a win is
    // evidence for the award, not an account of how the thing was built.
    ...(selected.announcements ?? []).map((post) => ({ label: 'Award', href: post.url })),
  ].filter((link): link is { label: string; href: string } => link !== null);

  return (
    <div className={styles.corpus}>
      <nav ref={railRef} className={styles.rail} aria-label="Systems">
        <ul>
          {projects.map((project) => {
            const current = project.id === selected.id;
            return (
              <li key={project.id}>
                <button
                  ref={current ? activeItemRef : undefined}
                  type="button"
                  className={`washed ${styles.railItem}`}
                  aria-current={current ? 'true' : undefined}
                  aria-controls={panelId}
                  data-testid={`project-${project.id}`}
                  onClick={() => select(project.id)}
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
                    <span className={styles.railStatus}>{project.status}</span>
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
            <span className={styles.awardStar} aria-hidden="true">
              ★
            </span>
          </p>
        ) : null}
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
            />
          </span>
        ) : null}

        <div className={styles.columns}>
          <div className={styles.prose}>
            <p>{selected.long_description}</p>
          </div>

          {/* Beside the description, not under it. A 56ch measure inside a pane
              twice that wide left the right half of every case study empty. */}
          <div className={styles.outcome}>
            <h3>Outcome</h3>
            <p>{selected.outcome}</p>
            <div className={styles.actions}>
              {links.map((link) => (
                <a
                  key={link.href}
                  className={styles.action}
                  data-variant="outline"
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
                className={styles.crossLink}
                data-variant="filled"
                href={getProjectNotesURL(selected.title)}
              >
                Decisions from {selected.title}
              </Link>
            </div>
          </div>
        </div>

        {/* Footnotes, at the foot. As a second column of ruled rows beside the
            prose this was an internal API reference sitting level with the
            writing; the stack is an apparatus note about how the thing was
            built, and apparatus belongs under the text it annotates. */}
        <aside className={styles.stackColumn} aria-label="Stack">
          <h3>Stack</h3>
          <dl className={styles.stack}>
            {selected.tech.map((item) => (
              <div key={item.name}>
                <dt>{item.name}</dt>
                <dd>{item.role}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </article>
    </div>
  );
}
