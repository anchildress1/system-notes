import { allProjects } from '@/data/projects';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | System Notes',
  description: 'Full list of projects and resources on System Notes.',
};

export default function SitemapPage() {
  return (
    <main
      style={{
        padding: '6rem 2rem',
        maxWidth: '800px',
        margin: '0 0 0 100px',
        color: 'hsl(var(--color-text-primary))',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontFamily: 'var(--font-sans)' }}>
        Sitemap
      </h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '3rem' }}>
          <Link
            href="/"
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'hsl(var(--color-accent-blue))',
            }}
          >
            Home
          </Link>
          <p style={{ marginTop: '0.5rem', color: 'hsl(var(--color-text-secondary))' }}>
            Main application interface and project grid.
          </p>
        </li>

        <li style={{ marginBottom: '3rem' }}>
          <Link
            href="/about"
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'hsl(var(--color-accent-blue))',
            }}
          >
            About
          </Link>
          <p style={{ marginTop: '0.5rem', color: 'hsl(var(--color-text-secondary))' }}>
            Information about the author and the system.
          </p>
        </li>

        {allProjects.map((project) => (
          <li key={project.id} style={{ marginBottom: '3rem' }}>
            <h2
              style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}
            >
              {project.title}
            </h2>
            <p style={{ marginBottom: '1rem', color: 'hsl(var(--color-text-secondary))' }}>
              {project.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'hsl(var(--color-accent-purple))', textDecoration: 'underline' }}
              >
                View Source ({project.owner})
              </a>
            </div>

            {project.blogs && project.blogs.length > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  paddingLeft: '1rem',
                  borderLeft: '2px solid hsl(var(--color-border))',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.1rem',
                    marginBottom: '0.5rem',
                    color: 'hsl(var(--color-text-muted))',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Related Reading
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {project.blogs.map((blog) => (
                    <li key={blog.url}>
                      <a
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'hsl(var(--color-text-primary))',
                          textDecoration: 'none',
                          borderBottom: '1px dotted hsl(var(--color-text-muted))',
                        }}
                      >
                        {blog.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
