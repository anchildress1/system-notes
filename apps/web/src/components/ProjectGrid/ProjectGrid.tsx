'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, allProjects } from '@/data/projects';
import ProjectCard from '@/components/ProjectCard/ProjectCard';
import ExpandedView from '@/components/ExpandedView/ExpandedView';
import styles from './ProjectGrid.module.css';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

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
        <motion.div
          className={styles.grid}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {allProjects.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className={styles.cardWrapper}
            >
              <ProjectCard
                project={p}
                onSelect={handleSelect}
                priority={allProjects.indexOf(p) < 2}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <AnimatePresence>
        {selectedProject && <ExpandedView project={selectedProject} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
