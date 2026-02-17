const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:8001';

export interface Project {
  id: string;
  title: string;
  description: string;
  github_url?: string;
}

export interface SystemDoc {
  content: string;
  format: string;
  path: string;
  error?: string;
}

export async function getProjects(): Promise<Project[]> {
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
}

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
