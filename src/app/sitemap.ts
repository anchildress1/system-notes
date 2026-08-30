import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();
  /* Build time, not request time. A sitemap that reports "modified now" on every
     fetch teaches a crawler the date means nothing; the deploy is the only moment
     any of these routes actually changes. */
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/notes`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
