import type { Metadata } from 'next';
import ProjectDirectory from '@/components/ProjectDirectory/ProjectDirectory';
import { getProjects } from '@/lib/api';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

const pageTitle = 'Exhibits | Ashley Childress';
const pageDescription =
  'Seven exhibits in AI, backend systems, and guardrail work. Each one shows its evidence and failure boundary.';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: '/projects',
});

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <main id="main-content" className={styles.main}>
      <section className={`page-head ${styles.hero}`} aria-labelledby="exhibits-heading">
        <h1 id="exhibits-heading">
          Systems should
          <br />
          <span>show their work.</span>
        </h1>
        <p className={styles.deck}>Seven exhibits in AI, backend systems, and guardrail work.</p>
      </section>
      <div className="page-column">
        <ProjectDirectory projects={projects} />
      </div>
    </main>
  );
}
