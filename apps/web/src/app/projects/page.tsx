import { Metadata } from 'next';
import Header from '@/components/Header/Header';
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
      <Header />
      <Hero title="Not here to play nice" subtitle="Disruption is the feature—loud by design" />
      <ProjectGrid projects={projects} />
    </main>
  );
}
