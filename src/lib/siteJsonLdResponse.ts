import { getProjects } from '@/lib/api';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { resolveBaseUrl } from '@/lib/urlSafety';

/** Builds the crawler-facing JSON-LD document from the validated portfolio registry. */
export function getSiteJsonLdResponse(): Response {
  const jsonLd = buildSiteJsonLd(getProjects(), resolveBaseUrl());

  return new Response(JSON.stringify(jsonLd, null, 2), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
