'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Project, allProjects } from '@/data/projects';
import ProjectCard from '@/components/ProjectCard/ProjectCard';
import dynamic from 'next/dynamic';
import styles from './ProjectGrid.module.css';

const ExpandedView = dynamic(() => import('@/components/ExpandedView/ExpandedView'), {
  ssr: false,
});

function parseProjectIdFromHash(hash: string): string | null {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleaned) return null;

  const params = new URLSearchParams(cleaned);
  const projectId = params.get('project');
  if (!projectId) return null;

  return projectId;
}

export default function ProjectGrid() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const applyHash = () => {
      const projectId = parseProjectIdFromHash(window.location.hash);
      if (!projectId) {
        setSelectedProject(null);
        return;
      }

      const match = allProjects.find((p) => p.id === projectId);
      setSelectedProject(match ?? null);
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const handleSelect = (project: Project) => {
    window.location.hash = `project=${encodeURIComponent(project.id)}`;
    setSelectedProject(project);
  };

  const handleClose = () => {
    setSelectedProject(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  return (
    <>
      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {allProjects.map((p) => (
            <div key={p.id} className={styles.cardWrapper}>
              <ProjectCard
                project={p}
                onSelect={handleSelect}
                priority={allProjects.indexOf(p) < 2}
              />
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedProject && <ExpandedView project={selectedProject} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
