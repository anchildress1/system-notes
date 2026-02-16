'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const applyHash = () => {
      const projectId = parseProjectIdFromHash(window.location.hash);
      if (!projectId) {
        setSelectedProject(null);
        setIsOpen(false);
        return;
      }

      const match = allProjects.find((p) => p.id === projectId);
      setSelectedProject(match ?? null);
      if (match) {
        setDialogVisible(true);
        setIsOpen(true);
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const handleSelect = (project: Project) => {
    window.location.hash = `project=${encodeURIComponent(project.id)}`;
    setSelectedProject(project);
    setDialogVisible(true);
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const handleExitComplete = useCallback(() => {
    if (!isOpen) {
      setDialogVisible(false);
      setSelectedProject(null);
    }
  }, [isOpen]);

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
        {dialogVisible && selectedProject && (
          <ExpandedView
            key={selectedProject.id}
            project={selectedProject}
            onClose={handleClose}
            isOpen={isOpen}
            onExitComplete={handleExitComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
