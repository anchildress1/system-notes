'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Project } from '@/lib/api';
import Image from 'next/image';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import Badge from '@/components/Badge/Badge';
import Tag from '@/components/Tag/Tag';
import Button from '@/components/Button/Button';
import { GitHubIcon, TrophyIcon } from '@/components/icons';
import { accentForPosition } from '@/lib/cardAccent';
import { FaArrowRight } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import cardStyles from '@/styles/card.module.css';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
  // 1-indexed grid position; drives the accent cycle shared with the fact cards.
  position?: number;
}

export default function ProjectCard({
  project,
  priority = false,
  position = 1,
}: Readonly<ProjectCardProps>) {
  const accent = accentForPosition(position);
  const ownerName = project.owner === 'anchildress1' ? 'ANCHildress1' : 'ChecKMarKDevTools';
  const isRetired = /archiv|retire|scrap/i.test(project.status);
  const [isFlipped, setIsFlipped] = useState(false);
  const backId = useId();
  const flipButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasFlipped = useRef(false);

  const flip = useCallback(() => setIsFlipped((prev) => !prev), []);

  useEffect(() => {
    if (!isFlipped) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFlipped(false);
      }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [isFlipped]);

  // Keyboard focus follows the visible face: on open move to the close button,
  // on close return to the flip trigger. Without this, focus is stranded on the
  // control that just became aria-hidden/tabIndex=-1. Skip the initial mount.
  useEffect(() => {
    if (isFlipped) {
      closeButtonRef.current?.focus();
    } else if (wasFlipped.current) {
      flipButtonRef.current?.focus();
    }
    wasFlipped.current = isFlipped;
  }, [isFlipped]);

  return (
    <article
      className={`${styles.cardLink} ${isFlipped ? styles.cardLinkFlipped : ''}`}
      data-accent={accent}
      data-testid={`project-card-${project.id}`}
    >
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        data-state={isFlipped ? 'expanded' : 'collapsed'}
      >
        <div className={styles.flipper}>
          <div
            className={`${styles.cardFront} ${cardStyles.face} ${
              project.award ? `${cardStyles.winnerBanner} shimmer-seam` : cardStyles.seam
            }`}
            aria-hidden={isFlipped}
          >
            {/* Front-only overlay: clicking the face flips to the detail side.
                It lives inside the front so it rotates away (and stops
                intercepting) once the back is showing. */}
            <button
              type="button"
              ref={flipButtonRef}
              className={styles.flipButton}
              onClick={flip}
              aria-expanded={isFlipped}
              aria-controls={backId}
              aria-label={`${project.title}. Flip to read the project note.`}
              tabIndex={isFlipped ? -1 : 0}
            />

            <div className={styles.imageContainer}>
              <div className={styles.imageWrapper}>
                <div className={styles.conceptBackground} />
                {project.image_url ? (
                  <Image
                    src={project.image_url}
                    alt={
                      project.image_alt ||
                      `Project concept art for ${project.title}: ${project.description}`
                    }
                    fill
                    className={styles.image}
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
                  />
                ) : (
                  <div
                    className={styles.placeholderArt}
                    role="img"
                    aria-label={`Placeholder initials for ${project.title}`}
                  >
                    <span className={styles.initials}>
                      {project.title.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {project.award && (
                <div className={styles.imageOverlay}>
                  <span className={styles.awardSlot}>
                    <Badge variant="award" icon={<TrophyIcon />}>
                      {project.award}
                    </Badge>
                  </span>
                </div>
              )}
            </div>

            <div className={styles.content}>
              <div className={styles.headerTop}>
                <Badge variant="neutral">{ownerName}</Badge>
                {project.status === 'Archived' && <Badge variant="neutral">ARCHIVED</Badge>}
                {project.repo_url && (
                  <span className={styles.sourceLinkRaise}>
                    <SourceLinkButton
                      url={project.repo_url}
                      label={`View ${project.title} source code on GitHub`}
                      onClick={(e) => {
                        e.stopPropagation();
                        globalThis.open(project.repo_url, '_blank', 'noopener,noreferrer');
                      }}
                      icon={<GitHubIcon />}
                      tabIndex={isFlipped ? -1 : 0}
                    />
                  </span>
                )}
              </div>

              <h2 className={styles.title}>{project.title}</h2>

              <p className={styles.description}>{project.purpose}</p>

              <div className={styles.techRow}>
                {project.tech.slice(0, 4).map((t) => (
                  <Tag key={t.name}>{t.name}</Tag>
                ))}
                {project.tech.length > 4 && <Tag>+{project.tech.length - 4}</Tag>}
              </div>

              <div className={styles.foot}>
                <span className={styles.footState}>
                  <span
                    className={`${styles.footDot} ${isRetired ? styles.footDotRetired : 'pulse-dot'}`}
                  />
                  {project.status}
                </span>
                <span className={styles.footRead} aria-hidden="true">
                  read note <FaArrowRight focusable="false" size={10} />
                </span>
              </div>
            </div>
          </div>

          <div
            className={styles.cardBack}
            id={backId}
            data-testid={`project-detail-${project.id}`}
            aria-hidden={!isFlipped}
          >
            <div className={styles.backHeader}>
              <div className={styles.backTitleRow}>
                <h3 className={styles.backTitle}>{project.title}</h3>
                {project.status && <span className={styles.backStatus}>{project.status}</span>}
              </div>
              <Button
                ref={closeButtonRef}
                className={styles.backClose}
                variant="icon"
                onClick={flip}
                aria-label={`Flip ${project.title} back to summary`}
                tabIndex={isFlipped ? 0 : -1}
              >
                <IoClose focusable="false" />
              </Button>
            </div>

            <div className={styles.backContent}>
              {project.description && <p className={styles.backLede}>{project.description}</p>}

              {project.long_description && (
                <p className={styles.backBody}>{project.long_description}</p>
              )}

              {project.outcome && (
                <div className={styles.backSection}>
                  <span className={styles.backLabel}>Outcome</span>
                  <p className={styles.backBody}>{project.outcome}</p>
                </div>
              )}

              <div className={styles.backSection}>
                <span className={styles.backLabel}>Tech</span>
                <ul className={styles.backTech}>
                  {project.tech.map((t) => (
                    <li key={t.name} className={styles.backTechItem}>
                      <span className={styles.backTechName}>{t.name}</span>
                      <span className={styles.backTechRole}>{t.role}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {project.blog_posts && project.blog_posts.length > 0 && (
                <div className={styles.backSection}>
                  <span className={styles.backLabel}>Related reading</span>
                  <ul className={styles.backLinks}>
                    {project.blog_posts.map((blog) => (
                      <li key={blog.url}>
                        <a
                          href={blog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={isFlipped ? 0 : -1}
                        >
                          {blog.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {project.repo_url && (
              <Button
                variant="secondary"
                href={project.repo_url}
                target="_blank"
                className={styles.backRepo}
                icon={<GitHubIcon />}
                iconRight={<FiExternalLink aria-hidden="true" focusable="false" size={14} />}
                tabIndex={isFlipped ? 0 : -1}
              >
                View source
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
