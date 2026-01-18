'use client';

import { useState } from 'react';
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

export default function ProjectGrid() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
              <ProjectCard project={p} onSelect={setSelectedProject} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <AnimatePresence>
        {selectedProject && (
          <ExpandedView project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
