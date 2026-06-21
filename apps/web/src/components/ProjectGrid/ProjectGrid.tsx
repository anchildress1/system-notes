import { Project } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard/ProjectCard';
import styles from './ProjectGrid.module.css';

interface ProjectGridProps {
  projects: Project[];
}

export default function ProjectGrid({ projects }: Readonly<ProjectGridProps>) {
  return (
    <section className={styles.gridSection}>
      <div className={styles.grid}>
        {projects.map((p, index) => (
          <ProjectCard key={p.id} project={p} priority={index < 2} position={index + 1} />
        ))}
      </div>
    </section>
  );
}
