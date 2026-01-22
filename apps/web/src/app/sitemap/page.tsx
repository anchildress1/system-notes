import Header from '@/components/Header/Header';
import { allProjects } from '@/data/projects';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Sitemap | System Notes',
  description: 'Full list of projects and resources on System Notes.',
};

export default function SitemapPage() {
  return (
    <main className={styles.main}>
      <Header />

      {/* Sitemap Hero */}
      <div className={styles.hero}>
        <h1 className={styles.title}>
          AI wanted it to be here <br /> and I didn&apos;t argue.
        </h1>
      </div>

      <div className={styles.container}>
        <ul className={styles.list}>
          {/* Main Pages */}
          <li className={styles.section}>
            <h2 className={styles.sectionTitle}>Core Navigation</h2>
            <ul className={styles.subList}>
              <li className={styles.item}>
                <Link href="/" className={styles.link}>
                  Projects
                </Link>
                <span className={styles.desc}> - Main application interface and project grid.</span>
              </li>
              <li className={styles.item}>
                <Link href="/about" className={styles.link}>
                  About
                </Link>
                <span className={styles.desc}> - Information about the author and the system.</span>
              </li>
              <li className={styles.item}>
                <a
                  href="https://dev.to/anchildress1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Blog
                </a>
                <span className={styles.desc}> - External engineering blog on Dev.to.</span>
              </li>
            </ul>
          </li>

          {/* Projects */}
          <li className={styles.section}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <ul className={styles.subList}>
              {allProjects.map((project) => (
                <li key={project.id} className={styles.item}>
                  <div className={styles.projectHeader}>
                    <span className={styles.projectTitle}>{project.title}</span>
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      view source
                    </a>
                  </div>
                  <p className={styles.projectDesc}>{project.description}</p>

                  {project.blogs && project.blogs.length > 0 && (
                    <ul className={styles.blogList}>
                      {project.blogs.map((blog) => (
                        <li key={blog.url}>
                          <a
                            href={blog.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.blogLink}
                          >
                            📄 {blog.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </main>
  );
}
