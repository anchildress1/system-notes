'use client';

import { motion } from 'framer-motion';
import styles from './ProjectGrid.module.css';

const projects = [
    {
        id: 'system-notes',
        title: 'System Notes',
        description: 'This very website. It&apos;s not just a portfolio; it&apos;s a cry for help formatted as a knowledge graph. Replaces a static site with a "living system" (read: I tinker with it constantly).',
        tech: ['Next.js', 'Framer Motion', 'Self-Deprecation'],
        link: 'https://github.com/anchildress1/system-notes'
    },
    {
        id: 'commitlint',
        title: 'Commitlint Config',
        description: 'Because "fixed stuff" is not a valid commit message, Dave. Enforcing semantic versioning with an iron fist and a linter.',
        tech: ['JavaScript', 'Git Hooks', 'Discipline'],
        link: 'https://github.com/anchildress1/commitlint-config'
    },
    {
        id: 'another-one',
        title: 'Mystery Project',
        description: 'Lives in the shadows. Might be an AI taking over the world, might be a To-Do app I started in 2021. You&apos;ll never know.',
        tech: ['Void', 'Null', 'Undefined'],
        link: '#'
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function ProjectGrid() {
    return (
        <motion.div
            className={styles.gridWrapper}
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
        >
            {projects.map((p) => (
                <motion.a
                    key={p.id}
                    href={p.link}
                    className={styles.card}
                    variants={item}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div className={styles.cardHeader}>
                        <span className={styles.projectTitle}>{p.title}</span>
                        <span className={styles.projectMeta}>{p.id}</span>
                    </div>
                    <p className={styles.projectDescription}>{p.description}</p>
                    <div className={styles.techStack}>
                        {p.tech.map(t => <span key={t} className={styles.techTag}>{t}</span>)}
                    </div>
                </motion.a>
            ))}
        </motion.div>
    );
}
