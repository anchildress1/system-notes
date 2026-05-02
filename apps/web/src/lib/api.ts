import { cache } from 'react';
import { API_URL } from '@/config';

export interface TechItem {
  name: string;
  role: string;
}

export interface BlogLink {
  title: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  status: string;
  description: string;
  purpose: string;
  long_description: string;
  outcome: string;
  tech: TechItem[];
  repo_url?: string;
  image_url?: string;
  image_alt?: string;
  owner: string;
  blog_posts?: BlogLink[];
  award?: string;
  order_rank?: number;
}

export interface SystemDoc {
  content: string;
  format: string;
  path: string;
  error?: string;
}

// React.cache() deduplicates getProjects calls within a single server request
// (layout.tsx + page.tsx both call it). This is request-scoped memoization, not persistent caching.
// next.revalidate=300 enables Next.js ISR: the result is cached for 5 minutes at the server
// layer and revalidated in the background. Without this, every page render hits the API cold
// because the root layout calls getProjects() on every route, keeping Cloud Run warm 24/7.
// Throws on failure — root layout catches with a fallback; route pages surface via error.tsx.
export const getProjects: () => Promise<Project[]> = cache(async () => {
  const res = await fetch(`${API_URL}/projects`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`);
  }
  return res.json();
});

export async function getSystemDoc(path: string): Promise<SystemDoc | null> {
  try {
    const url = `${API_URL}/system/doc/${path}`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        content: '',
        format: 'text',
        path,
        error: `Error ${res.status}: ${text || res.statusText}`,
      };
    }
    return res.json();
  } catch (error) {
    console.error('[SystemDoc] Network/API Error:', error);
    return {
      content: '',
      format: 'text',
      path,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
