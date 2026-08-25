import type { Metadata } from 'next';
import ProjectDirectory from '@/components/ProjectDirectory/ProjectDirectory';
import { getProjects } from '@/lib/api';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

const pageTitle = 'Exhibits | Ashley Childress';
const pageDescription =
  'Shipped systems entered into evidence, each cross-filed with the decisions it produced — including the ones that failed on purpose.';

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
        <p className="page-head-slug">
          <span>Exhibits</span>
          <span>{projects.length} entered into evidence</span>
        </p>
        <h1 id="exhibits-heading">
          What I&rsquo;ve shipped.
          <span>Including what I stopped.</span>
        </h1>
      </section>
      <div className="page-column">
        <ProjectDirectory projects={projects} />
      </div>
    </main>
  );
}
