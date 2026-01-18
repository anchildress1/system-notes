'use client';

import { motion } from 'framer-motion';
import { Project } from '@/data/projects';
import styles from './ProjectModal.module.css';
import { useEffect } from 'react';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        layoutId={`card-${project.id}`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className={styles.banner}>
          {project.imageUrl ? (
            <img src={project.imageUrl} alt="" className={styles.bannerImage} />
          ) : (
            <div className={styles.placeholderBanner} />
          )}
        </div>

        <div className={styles.modalContent}>
          <h2 className={styles.title}>{project.title}</h2>
          <div className={styles.meta}>
            <span>{project.owner === 'anchildress1' ? 'anchildress1' : 'CheckMarK DevTools'}</span>
            {/* Future: Add more meta like "Updated 2 days ago" */}
          </div>

          <p className={styles.bodyText}>{project.longDescription || project.description}</p>

          <div className={styles.infoSection}>
            <h4 className={styles.sectionHeader}>Tech Stack</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {project.tech.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    background: 'hsl(var(--color-bg-elevated))',
                    borderRadius: '4px',
                    color: 'hsl(var(--color-text-primary))',
                  }}
                >
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
              className={styles.primaryBtn}
            >
              View Repository on GitHub
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
