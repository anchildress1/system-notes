'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, personalProjects, orgProjects } from '@/data/projects';
import ProjectCard from '@/components/ProjectCard/ProjectCard';
import ProjectModal from '@/components/ProjectModal/ProjectModal';
import styles from './ProjectGrid.module.css';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function ProjectGrid() {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    return (
        <>
            <div className={styles.gridSection}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.icon}>🦄</span>
                    Personal Projects <span style={{ opacity: 0.4, fontSize: '0.9em' }}>(anchildress1)</span>
                </h2>

                <motion.div
                    className={styles.grid}
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    {personalProjects.map((p) => (
                        <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className={styles.cardWrapper}>
                            <ProjectCard project={p} onSelect={setSelectedProject} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div className={styles.gridSection}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.icon}>🏢</span>
                    Organization <span style={{ opacity: 0.4, fontSize: '0.9em' }}>(CheckMarK DevTools)</span>
                </h2>

                <motion.div
                    className={styles.grid}
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    {orgProjects.map((p) => (
                        <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className={styles.cardWrapper}>
                            <ProjectCard project={p} onSelect={setSelectedProject} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <AnimatePresence>
                {selectedProject && (
                    <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
                )}
            </AnimatePresence>
        </>
    );
}
