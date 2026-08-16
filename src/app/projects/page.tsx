import type { Metadata } from 'next';
import ProjectDirectory from '@/components/ProjectDirectory/ProjectDirectory';
import { getProjects } from '@/lib/api';
import { groupProjects } from '@/lib/projectStatus';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

const pageTitle = "Projects | Ashley's System Notes";
const pageDescription =
  'A complete directory of Ashley Childress projects: what shipped, what stopped, and what each one proved.';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: '/projects',
});

export default function ProjectsPage() {
  const projects = getProjects();
  const groups = groupProjects(projects);

  return (
    <main id="main-content" className={styles.main}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Projects · {projects.length} total</p>
        <h1>
          What shipped. <em>What stopped.</em>
        </h1>
        <p>
          Current systems, retired tools, archived experiments, and deliberate dead ends. Each one
          stays because the outcome matters more than the victory pose.
        </p>
        <nav className={styles.jumpLinks} aria-label="Project groups">
          <a href="#current-projects">Current · {groups.current.length}</a>
          <a href="#ended-projects">Ended · {groups.ended.length}</a>
        </nav>
      </header>
      <ProjectDirectory projects={projects} />
    </main>
  );
}
