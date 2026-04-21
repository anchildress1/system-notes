import { Project } from '@/lib/api';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SourceLinkButton from '@/components/SourceLinkButton/SourceLinkButton';
import { GitHubIcon, TrophyIcon } from '@/components/icons';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  priority?: boolean;
}

export default function ProjectCard({
  project,
  onSelect,
  priority = false,
}: Readonly<ProjectCardProps>) {
  const ownerName = project.owner === 'anchildress1' ? 'ANCHildress1' : 'ChecKMarKDevTools';

  return (
    <motion.div
      role="button"
      tabIndex={0}
      className={styles.card}
      onClick={() => onSelect(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project);
        }
      }}
      data-testid={`project-card-${project.id}`}
    >
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
              <span className={styles.initials}>{project.title.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
      {/* Header / Title Area */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className="card-header-badge">{ownerName}</span>
            {project.status === 'Archived' && <span className="card-header-badge">ARCHIVED</span>}
            {project.repo_url && (
              <SourceLinkButton
                url={project.repo_url}
                label={`View ${project.title} source code on GitHub`}
                onClick={(e) => {
                  e.stopPropagation();
                  globalThis.open(project.repo_url, '_blank', 'noopener,noreferrer');
                }}
                icon={<GitHubIcon />}
              />
            )}
          </div>
          <h2 className={styles.title}>{project.title}</h2>
          {project.award && (
            <div className="award-badge">
              <TrophyIcon className="award-badge-icon" />
              <span>{project.award}</span>
            </div>
          )}
        </div>

        <p className={styles.description}>{project.purpose}</p>

        <div className={styles.loadoutGrid}>
          {project.tech.slice(0, 4).map((t) => (
            <div key={t.name} className={styles.loadoutBadge}>
              <span className={styles.techName}>{t.name}</span>
              <span className={styles.techRole}>{t.role}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
