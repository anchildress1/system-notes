import { getSiteJsonLdResponse } from '@/lib/siteJsonLdResponse';

// Prerendered: the payload only changes when projects.json does, and a
// scale-to-zero instance should not wake to rebuild it for a crawler.
export const dynamic = 'force-static';

export const GET = getSiteJsonLdResponse;
