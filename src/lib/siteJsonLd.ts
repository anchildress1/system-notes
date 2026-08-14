import type { Project } from '@/lib/api';

/**
 * Builds the site-wide schema.org graph from the project list. Shared by the inline
 * <head> block and the /site.jsonld route so the two cannot drift apart.
 */
export function buildSiteJsonLd(projects: Project[], baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Ashley's System Notes",
    url: baseUrl,
    description: 'A living, queryable index of projects and decisions.',
    author: {
      '@type': 'Person',
      name: 'Ashley Childress',
      url: baseUrl,
      sameAs: [baseUrl, 'https://github.com/anchildress1', 'https://dev.to/anchildress1'],
    },
    publisher: {
      '@type': 'Person',
      name: 'Ashley Childress',
    },
    hasPart: projects.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.title,
      description: p.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: p.app_url,
      codeRepository: p.repo_url,
      award: p.award,
      image: p.image_url ? new URL(p.image_url, baseUrl).toString() : undefined,
      relatedLink: p.blog_posts?.map((b) => b.url) ?? [],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    })),
  };
}
