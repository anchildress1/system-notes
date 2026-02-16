'use client';

import { motion } from 'framer-motion';
import { Project } from '@/data/projects';
import styles from './ExpandedView.module.css';
import { useEffect, useRef } from 'react';
import { overlayVariants, overlayTransition, cardFlipVariants } from '@/utils/animations';

interface ExpandedViewProps {
  project: Project;
  onClose: () => void;
}

export default function ExpandedView({ project, onClose }: ExpandedViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the card on mount for accessibility and keyboard events
    if (cardRef.current) {
      cardRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Manual scroll handling for better UX since body scroll is locked
      if (cardRef.current) {
        const scrollAmount = 60;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cardRef.current.scrollBy({ top: scrollAmount, behavior: 'auto' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          cardRef.current.scrollBy({ top: -scrollAmount, behavior: 'auto' });
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      onClick={onClose}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={overlayTransition}
    >
      <motion.div
        ref={cardRef}
        className={styles.expandedCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        data-testid="expanded-view-dialog"
        layoutId={`card-${project.id}`}
        variants={cardFlipVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button
          className={`close-button-global ${styles.closeButton}`}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.titleRow}>
                <h2 className={styles.title} id="modal-title">
                  {project.title}
                </h2>
                {project.status && <span className={styles.statusBadge}>{project.status}</span>}
              </div>
              <div className={styles.metaRow}>
                <span>{project.owner}</span>
              </div>
              {project.description && <p className={styles.subheader}>{project.description}</p>}
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.mainColumn}>
              {project.purpose && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Purpose</h2>
                  <p className={styles.bodyText}>{project.purpose}</p>
                </div>
              )}
              {project.longDescription && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Project Output</h2>
                  <p className={styles.bodyText}>{project.longDescription}</p>
                </div>
              )}

              {project.outcome && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Outcome</h2>
                  <p className={styles.bodyText}>{project.outcome}</p>
                </div>
              )}

              {project.blogs && project.blogs.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Related Reading</h2>
                  <ul className={styles.blogList}>
                    {project.blogs.map((blog) => (
                      <li key={blog.url} className={styles.blogItem}>
                        <a
                          href={blog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.blogLink}
                        >
                          {blog.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.sideColumn}>
              <div className={styles.techStack}>
                <h2 className={styles.sectionTitle}>Tech Stack</h2>
                <div className={styles.tags}>
                  {project.tech.map((t) => (
                    <div key={t.name} className={styles.tagItem}>
                      <span className={styles.tagName}>{t.name}</span>
                      <span className={styles.tagRole}>{t.role}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.actions}>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.repoLink}
                  >
                    GitHub Repo
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
