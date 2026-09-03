import type { Project } from '@/lib/api';
import { profile } from '@/data/profile';

/**
 * Builds the site-wide schema.org graph from the project list. Shared by the inline
 * <head> block and the /site.jsonld route so the two cannot drift apart.
 */
export function buildSiteJsonLd(projects: Project[], baseUrl: string) {
  /* A person searched by name needs a Person node with an @id, not one nested as
     a WebSite's author. sameAs is the whole point: it is what ties this domain to
     the profiles a search engine already knows. */
  const person = {
    '@type': 'Person',
    '@id': `${baseUrl}/#person`,
    name: profile.name,
    jobTitle: profile.role,
    email: profile.email,
    url: baseUrl,
    image: new URL(profile.portrait.light, baseUrl).toString(),
    description: profile.introduction[0],
    knowsAbout: [...profile.trackRecord.core, ...profile.trackRecord.applied],
    sameAs: [baseUrl, ...profile.links.map((link) => link.href)],
    hasCredential: profile.certifications.map((certification) => ({
      '@type': 'EducationalOccupationalCredential',
      name: certification.name,
      credentialCategory: 'certification',
      url: certification.credentialUrl,
      recognizedBy: { '@type': 'Organization', name: certification.issuer },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Ashley's System Notes",
    url: baseUrl,
    description: 'A living, queryable index of projects and decisions.',
    author: person,
    publisher: { '@id': person['@id'] },
    hasPart: projects.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.title,
      description: p.description,
      author: { '@id': person['@id'] },
      url: p.app_url,
      codeRepository: p.repo_url,
      award: p.award,
      image: p.image_url ? new URL(p.image_url, baseUrl).toString() : undefined,
      relatedLink: p.blog_posts?.map((b) => b.url) ?? [],
    })),
  };
}
