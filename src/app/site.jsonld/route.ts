import { getProjects } from '@/lib/api';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { resolveBaseUrl } from '@/lib/urlSafety';

// Prerendered: the payload only changes when projects.json does, and a
// scale-to-zero instance should not wake to rebuild it for a crawler.
export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = resolveBaseUrl();
  const jsonLd = buildSiteJsonLd(getProjects(), baseUrl);

  return new Response(JSON.stringify(jsonLd, null, 2), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
