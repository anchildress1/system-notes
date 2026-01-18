'use client';

import { motion } from 'framer-motion';
import { Project } from '@/data/projects';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <motion.div
      className={styles.card}
      layoutId={`card-${project.id}`}
      onClick={() => onSelect(project)}
      whileHover={{ y: -5 }}
    >
      <div className={styles.imageContainer}>
        <motion.div className={styles.imageWrapper} layoutId={`image-${project.id}`}>
          <div className={styles.conceptBackground} />
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={`Thumbnail for ${project.title}`} className={styles.image} />
          ) : (
            <div className={styles.placeholderArt}>
              <span className={styles.initials}>{project.title.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
        </motion.div>
      </div>
      {/* Header / Title Area */}
      {/* Header / Title Area */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.ownerBadge}>
              {project.owner === 'anchildress1' ? '👤 system' : '🏢 checkout'}
            </span>
            {/* Hyperlink removed for clean aesthetic */}
          </div>
          <h2 className={styles.title}>{project.title}</h2>
        </div>

        <p className={styles.description}>{project.description}</p>

        <div className={styles.tags}>
          {project.tech.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
