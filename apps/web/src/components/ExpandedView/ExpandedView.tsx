'use client';

import { motion } from 'framer-motion';
import { Project } from '@/data/projects';
import styles from './ExpandedView.module.css';
import { useEffect } from 'react';
import Image from 'next/image';

interface ExpandedViewProps {
  project: Project;
  onClose: () => void;
}

export default function ExpandedView({ project, onClose }: ExpandedViewProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={styles.expandedCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            <div
              className={styles.conceptBackground}
              style={{ backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : undefined }}
            />
            {project.imageUrl && (
              <Image
                src={project.imageUrl}
                alt={project.title}
                className={styles.bannerImage}
                fill
                style={{ objectFit: 'cover' }}
                priority={false}
              />
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
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
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.titleRow}>
                <h2 className={styles.title} id="modal-title">{project.title}</h2>
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
              {project.longDescription && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Project Output</h3>
                  <p className={styles.longDescription}>{project.longDescription}</p>
                </div>
              )}

              {project.outcome && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Outcome</h3>
                  <p className={styles.outcome}>{project.outcome}</p>
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
              </div>

              <div className={styles.actions}>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.repoLink}
                >
                  View Source on GitHub
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
      </motion.div>
    </motion.div>
  );
}
