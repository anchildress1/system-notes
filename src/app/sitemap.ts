import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from '@/lib/urlSafety';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();

  return [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/choices`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/human`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
