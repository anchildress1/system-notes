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
      <section className={styles.hero} aria-labelledby="exhibits-heading">
        <h1 id="exhibits-heading">
          What I&apos;ve shipped. <em>Including what I stopped.</em>
        </h1>
      </section>
      <ProjectDirectory projects={projects} />
    </main>
  );
}
