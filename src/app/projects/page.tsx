import type { Metadata } from 'next';
import ProjectDirectory, {
  EXHIBIT_DECK,
  EXHIBIT_SUMMARY,
} from '@/components/ProjectDirectory/ProjectDirectory';
import { getProjects } from '@/lib/api';
import { buildPageMetadata } from '@/lib/siteMetadata';
import styles from './page.module.css';

const pageTitle = 'Exhibits | Ashley Childress';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: EXHIBIT_SUMMARY,
  path: '/projects',
});

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <main id="main-content" className={styles.main}>
      <section className="page-head" aria-labelledby="exhibits-heading">
        <h1 id="exhibits-heading">
          What I&rsquo;ve built.
          <br />
          <span>And what I had to figure out.</span>
        </h1>
        <p className={styles.deck}>{EXHIBIT_DECK}</p>
      </section>
      <div className={`page-column ${styles.exhibition}`}>
        <ProjectDirectory projects={projects} />
      </div>
    </main>
  );
}
