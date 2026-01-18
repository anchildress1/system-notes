'use client';

import { motion } from 'framer-motion';
import { Project } from '@/data/projects';
import styles from './ExpandedView.module.css';
import { useEffect } from 'react';

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
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        className={styles.expandedCard}
        layoutId={`card-${project.id}`}
        onClick={(e) => e.stopPropagation()}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className={styles.imageContainer}>
          <motion.div className={styles.imageWrapper} layoutId={`image-${project.id}`}>
            {/* Ambient Background derived from image */}
            <div
              className={styles.conceptBackground}
              style={{ backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : undefined }}
            />

            {project.imageUrl && <img src={project.imageUrl} alt="" className={styles.image} />}
          </motion.div>

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

        <motion.div className={styles.content} layoutId={`content-${project.id}`}>
          <div className={styles.header}>
            <div>
              <div className={styles.metaRow}>
                <span>👤 {project.owner}</span>
              </div>
              <h2 className={styles.title}>{project.title}</h2>
            </div>
          </div>

          <div className={styles.body}>
            <p className={styles.longDescription}>
              {project.longDescription || project.description}
            </p>

            <div className={styles.techStack}>
              <h3 className={styles.sectionTitle}>Tech Stack</h3>
              <div className={styles.tags}>
                {project.tech.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
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
        </motion.div>
      </motion.div>
    </div>
  );
}
