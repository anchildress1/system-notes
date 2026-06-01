'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Project } from '@/lib/api';
import styles from './ExpandedView.module.css';
import { useEffect, useRef } from 'react';
import { overlayTransition, cardFlipVariants } from '@/utils/animations';
import { CloseIcon } from '@/components/icons';
import { FiExternalLink } from 'react-icons/fi';

interface ExpandedViewProps {
  project: Project;
  onClose: () => void;
  isOpen: boolean;
  onExitComplete: () => void;
}

export default function ExpandedView({
  project,
  onClose,
  isOpen,
  onExitComplete,
}: Readonly<ExpandedViewProps>) {
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
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
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
        variants={cardFlipVariants}
        initial="hidden"
        animate={isOpen ? 'visible' : 'exit'}
        onAnimationComplete={(definition) => {
          if (definition === 'exit') onExitComplete();
        }}
      >
        {/* Zero-height sticky wrapper keeps button visible over scroll without displacing content */}
        <div className={styles.closeWrap}>
          <button
            type="button"
            className={`close-button-global ${styles.closeButton}`}
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {project.image_url && (
          <div className={styles.imageContainer} data-testid="expanded-image-container">
            <div className={styles.imageWrapper}>
              <div
                className={styles.conceptBackground}
                style={{ backgroundImage: `url(${project.image_url})` }}
              />
              <Image
                src={project.image_url}
                alt={project.image_alt || project.title}
                className={styles.bannerImage}
                fill
                style={{ objectFit: 'cover' }}
                priority={false}
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </div>
        )}

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
              {project.description && <p className={styles.bodyText}>{project.description}</p>}
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.mainColumn}>
              {project.purpose && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Purpose</h3>
                  <p className={styles.bodyText}>{project.purpose}</p>
                </div>
              )}
              {project.long_description && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Project Output</h3>
                  <p className={styles.bodyText}>{project.long_description}</p>
                </div>
              )}

              {project.outcome && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Outcome</h3>
                  <p className={styles.bodyText}>{project.outcome}</p>
                </div>
              )}
            </div>

            <div className={styles.sideColumn}>
              <div className={styles.techStack}>
                <h3 className={styles.sectionTitle}>Tech Stack</h3>
                <div className={styles.tags}>
                  {project.tech.map((t) => (
                    <div key={t.name} className={styles.tagItem}>
                      <span className={styles.tagName}>{t.name}</span>
                      <span className={styles.tagRole}>{t.role}</span>
                    </div>
                  ))}
                </div>

                {project.repo_url && (
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.repoLinkCompact}
                  >
                    GitHub Repo
                    <FiExternalLink aria-hidden="true" focusable="false" size={16} />
                  </a>
                )}
              </div>
            </div>

            {project.blog_posts && project.blog_posts.length > 0 && (
              <div className={styles.fullWidthSection}>
                <h3 className={styles.sectionTitle}>Related Reading</h3>
                <ul className={styles.blogList}>
                  {project.blog_posts.map((blog) => (
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
        </div>
      </motion.div>
    </motion.div>
  );
}
