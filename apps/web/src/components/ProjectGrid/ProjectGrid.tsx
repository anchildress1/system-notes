'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Project, allProjects } from '@/data/projects';
import ProjectCard from '@/components/ProjectCard/ProjectCard';
import dynamic from 'next/dynamic';
import styles from './ProjectGrid.module.css';

const ExpandedView = dynamic(() => import('@/components/ExpandedView/ExpandedView'), {
  ssr: false,
});

export default function ProjectGrid() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <>
      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {allProjects.map((p) => (
            <div key={p.id} className={styles.cardWrapper}>
              <ProjectCard
                project={p}
                onSelect={setSelectedProject}
                priority={allProjects.indexOf(p) < 2}
              />
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedProject && (
          <ExpandedView project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
