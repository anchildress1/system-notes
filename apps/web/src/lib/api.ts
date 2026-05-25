import rawProjects from '@/data/projects.json';

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

type RawProject = Record<string, unknown>;

function parseProject(item: RawProject): Project {
  return {
    id: item['objectID'] as string,
    title: item['name'] as string,
    status: (item['status'] as string) ?? '',
    description: (item['what_it_is'] as string) ?? '',
    purpose: (item['why_it_exists'] as string) ?? '',
    long_description: (item['long_description'] as string) ?? '',
    outcome: (item['outcome'] as string) ?? '',
    tech: (item['tech'] as TechItem[]) ?? [],
    repo_url: item['repo_url'] as string | undefined,
    image_url: item['image_url'] as string | undefined,
    image_alt: item['image_alt'] as string | undefined,
    owner: (item['owner'] as string) ?? '',
    blog_posts: (item['blog_posts'] as BlogLink[]) ?? [],
    award: item['award'] as string | undefined,
    order_rank: (item['order_rank'] as number) ?? 999,
  };
}

export async function getProjects(): Promise<Project[]> {
  return (rawProjects as RawProject[])
    .map(parseProject)
    .sort((a, b) => (a.order_rank ?? 999) - (b.order_rank ?? 999));
}
