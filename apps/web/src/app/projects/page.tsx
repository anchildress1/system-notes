import { Metadata } from 'next';
import Header from '@/components/Header/Header';
import Masthead from '@/components/Masthead/Masthead';
import Hero from '@/components/Hero/Hero';
import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import { getProjects } from '@/lib/api';
import styles from './page.module.css';

// Opt out of static pre-rendering — projects data must be fetched at request time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Builds',
  description: 'Explore my portfolio of software systems, tools, and experiments.',
};

export default async function Projects() {
  const projects = await getProjects();

  return (
    <main className={styles.main} id="main-content">
      <Header />
      <Masthead />
      <Hero
        title="Things I built and broke."
        titleAccent="I"
        accentWord="shipped."
        subtitle={`${projects.length} artifacts — tools, experiments, and systems. Each earned its place; the ones that didn't aren't listed.`}
      />
      <ProjectGrid projects={projects} />
    </main>
  );
}
