import { Metadata } from 'next';
import Hero from '@/components/Hero/Hero';
import Button from '@/components/Button/Button';
import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import { getProjects } from '@/lib/api';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Builds',
  description:
    'Shipped tools, award-winning builds, and the experiments I scrapped on purpose — wins and write-offs, all on the record.',
};

export default function Builds() {
  const projects = getProjects();

  return (
    <main className={styles.main} id="main-content">
      <Hero
        title="Things I built and broke."
        titleAccent="I"
        accentWord="shipped."
        subtitle="I'm Ashley — a senior software engineer who builds AI systems that fail loudly instead of quietly lying. Wins and write-offs, both on the record."
        actions={
          <Button
            variant="primary"
            size="md"
            href="/choices"
            iconRight={<span aria-hidden="true">→</span>}
          >
            Query the index
          </Button>
        }
      />
      <ProjectGrid projects={projects} />
    </main>
  );
}
