import { cache } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8000';

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
// cache: 'no-store' ensures data is always fresh at request time, never statically pre-rendered.
// Throws on failure — root layout catches with a fallback; route pages surface via error.tsx.
export const getProjects: () => Promise<Project[]> = cache(async () => {
  const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
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
