import { Project } from '@/data/projects';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  priority?: boolean;
}

export default function ProjectCard({ project, onSelect, priority = false }: ProjectCardProps) {
  const ownerName = project.owner === 'anchildress1' ? 'ANCHildress1' : 'CheckMarK DevTools';

  return (
    <motion.div
      layoutId={`card-${project.id}`}
      className={styles.card}
      onClick={() => onSelect(project)}
      data-testid={`project-card-${project.id}`}
    >
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <div className={styles.conceptBackground} />
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={
                project.imageAlt ||
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
              <span className={styles.initials}>{project.title.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
      {/* Header / Title Area */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.ownerBadge}>{ownerName}</span>
            {project.id === 'checkmark-copilot-chat' && (
              <span className={styles.archivedTag}>ARCHIVED</span>
            )}
            <SourceLinkButton
              url={project.repoUrl}
              label={`View ${project.title} source code on GitHub`}
              onClick={(e) => {
                e.stopPropagation();
                window.open(project.repoUrl, '_blank', 'noopener,noreferrer');
              }}
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              }
            />
          </div>
          <h2 className={styles.title}>{project.title}</h2>
        </div>

        <h3 className={styles.intentLabel}>Purpose</h3>
        <p className={styles.description}>{project.purpose}</p>

        <div className="simple-tags">
          {project.tech.map((t) => (
            <span key={t.name} className="simple-tag">
              {t.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
