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
      <section className={styles.hero}>
        <p className={styles.kicker}>{projects.length} systems · every choice I&apos;d defend</p>
        <h1>
          Exhi<em>bits</em>
        </h1>
        <p className={styles.claim}>The choices are the argument.</p>
        <p className={styles.blurb}>
          Shipped systems, each cross-filed with the decisions it produced. The ones that failed on
          purpose stay in the record.
        </p>
      </section>
      <ProjectDirectory projects={projects} />
    </main>
  );
}
