const API_URL = process.env.API_URL || 'http://localhost:8000';

export interface Project {
  id: string;
  title: string;
  description: string;
  github_url?: string;
}

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch projects');
    }
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}
