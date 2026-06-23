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
  app_url?: string;
  image_url?: string;
  image_alt?: string;
  owner: string;
  blog_posts?: BlogLink[];
  award?: string;
  order_rank?: number;
}

type RawProject = Record<string, unknown>;

// projects.json carries JSON null for absent optional fields; coerce to undefined
// so the Project type's `string | undefined` contract holds at runtime.
const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

function parseProject(item: RawProject): Project {
  return {
    id: item['objectID'] as string,
    title: item['name'] as string,
    status: str(item['status']) ?? '',
    description: str(item['what_it_is']) ?? '',
    purpose: str(item['why_it_exists']) ?? '',
    long_description: str(item['long_description']) ?? '',
    outcome: str(item['outcome']) ?? '',
    tech: (item['tech'] as TechItem[]) ?? [],
    repo_url: str(item['repo_url']),
    app_url: str(item['app_url']),
    image_url: str(item['image_url']),
    image_alt: str(item['image_alt']),
    owner: str(item['owner']) ?? '',
    blog_posts: (item['blog_posts'] as BlogLink[]) ?? [],
    award: str(item['award']),
    order_rank: (item['order_rank'] as number) ?? 999,
  };
}

export async function getProjects(): Promise<Project[]> {
  return (rawProjects as RawProject[])
    .map(parseProject)
    .sort((a, b) => (a.order_rank ?? 999) - (b.order_rank ?? 999));
}
