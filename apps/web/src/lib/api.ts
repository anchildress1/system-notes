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
  award?: string;
  order_rank?: number;
}

export interface SystemDoc {
  content: string;
  format: string;
  path: string;
  error?: string;
}

// cache() deduplicates calls within a single request (layout + page both call this).
// cache: 'no-store' ensures data is always fresh at request time, never statically pre-rendered.
export const getProjects: () => Promise<Project[]> = cache(async () => {
  try {
    const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch projects');
    }
    return res.json();
  } catch (error) {
    console.warn('API Error:', error);
    return [];
  }
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
    console.warn('[SystemDoc] Network/API Error:', error);
    return {
      content: '',
      format: 'text',
      path,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
