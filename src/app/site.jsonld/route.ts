import { getProjects } from '@/lib/api';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';

// Prerendered at build time rather than served per request: the payload only
// changes when projects.json does, and a scale-to-zero instance should not be
// waking up to rebuild the same document for a crawler.
export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://anchildress1.dev';
  const jsonLd = buildSiteJsonLd(await getProjects(), baseUrl);

  return new Response(JSON.stringify(jsonLd, null, 2), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
