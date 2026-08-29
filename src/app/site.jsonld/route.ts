// Prerendered: the payload only changes when projects.json does, and a
// scale-to-zero instance should not wake to rebuild it for a crawler.
export const dynamic = 'force-static';

// Re-exported rather than imported and reassigned: this file is the adapter
// Next discovers, and the response builder it points at is what the tests drive.
export { getSiteJsonLdResponse as GET } from '@/lib/siteJsonLdResponse';
