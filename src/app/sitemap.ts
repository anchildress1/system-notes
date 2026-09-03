import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

/* URLs only. One build-time stamp shared by every route claimed all four had
   changed whenever any deploy shipped, and nothing here carries a real
   per-route date to replace it with. Google ignores changefreq and priority. */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();

  return [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/notes` },
    { url: `${baseUrl}/projects` },
    { url: `${baseUrl}/about` },
  ];
}
