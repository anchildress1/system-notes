import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

/* URLs only: nothing here carries a real per-route date, and Google ignores
   changefreq and priority. */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();

  return [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/notes` },
    { url: `${baseUrl}/projects` },
    { url: `${baseUrl}/about` },
  ];
}
