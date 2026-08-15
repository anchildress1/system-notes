import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();

  return [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/projects`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
