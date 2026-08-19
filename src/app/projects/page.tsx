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
        <p className={styles.kicker}>Exhibits · {projects.length} total</p>
        <h1>
          The choices are the argument. <em>These are the exhibits.</em>
        </h1>
        <p>
          Shipped systems entered into evidence — alongside the retired, the archived, and the
          deliberate dead ends. Each one is cross-filed with the cards it produced in the index.
        </p>
        {/* Each exhibit states its own status, so the directory reads in one
            uninterrupted run rather than splitting into current and ended. */}
        <p className={styles.tally}>
          {groups.current.length} current · {groups.ended.length} ended
        </p>
      </header>
      <ProjectDirectory projects={projects} />
    </main>
  );
}
