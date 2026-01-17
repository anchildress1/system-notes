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
                {project.imageUrl ? (
                    <img src={project.imageUrl} alt="" className={styles.image} />
                ) : (
                    <div className={styles.placeholderArt}>
                        <span className={styles.initials}>{project.title.substring(0, 2).toUpperCase()}</span>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{project.title}</h3>
                    <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ghLink}
                        onClick={(e) => e.stopPropagation()} // Don't trigger card selection
                        aria-label={`View ${project.title} on GitHub`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0 3 1.5 2.64 2.64 0 0 1 2.5 0c4.1 2 6 5.2 6 8 0 3.6-3 5.5-6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                            <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                    </a>
                </div>

                <p className={styles.description}>{project.description}</p>

                <div className={styles.tags}>
                    {project.tech.map(t => (
                        <span key={t} className={styles.tag}>{t}</span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
