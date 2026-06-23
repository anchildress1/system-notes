import { Metadata } from 'next';
import Hero from '@/components/Hero/Hero';
import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import { getProjects } from '@/lib/api';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Builds',
  description: 'Explore my portfolio of software systems, tools, and experiments.',
};

export default async function Projects() {
  const projects = await getProjects();

  return (
    <main className={styles.main} id="main-content">
      <Hero
        title="Things I built and broke."
        titleAccent="I"
        accentWord="shipped."
        subtitle="Shipped tools, award-winning builds, and the experiments I scrapped on purpose — wins and write-offs, all on the record."
      />
      <ProjectGrid projects={projects} />
    </main>
  );
}
