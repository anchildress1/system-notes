import type { MetadataRoute } from 'next';
import { getIndexableNoteIds } from '@/lib/notes';
import { resolveBaseUrl } from '@/lib/urlSafety';

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const noteIds = await getIndexableNoteIds();

  return [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/notes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/projects`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    ...noteIds.map((noteId) => ({
      url: `${baseUrl}/notes/${encodeURIComponent(noteId)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
