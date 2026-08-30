import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

/* Module scope, so it is stamped once when the route is built rather than once
   per call. The route prerenders today, which made the two equivalent — but a
   sitemap that reports "modified now" on every fetch teaches a crawler the date
   means nothing, and that promise should not rest on the route staying static. */
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/notes`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
