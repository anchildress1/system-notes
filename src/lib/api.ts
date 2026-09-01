import rawProjects from '@/data/projects.json';
import { isSafeExternalUrl } from '@/lib/urlSafety';

interface TechItem {
  name: string;
  role: string;
}

interface BlogLink {
  title: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  status: string;
  description: string;
  tech: TechItem[];
  repo_url?: string;
  app_url?: string;
  image_url?: string;
  image_alt?: string;
  blog_posts: BlogLink[];
  /** Award and news posts. Evidence for the award, not writing about the work. */
  announcements: BlogLink[];
  award?: string;
  order_rank: number;
}

type RawProject = Record<string, unknown>;

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

function requiredString(item: RawProject, key: string, index: number): string {
  const value = str(item[key])?.trim();
  if (!value) throw new TypeError(`projects.json entry ${index} has an invalid ${key}.`);
  return value;
}

function externalUrl(item: RawProject, key: string, index: number): string | undefined {
  const value = str(item[key]);
  if (value === undefined || value.length === 0) return undefined;
  if (!isSafeExternalUrl(value)) {
    throw new TypeError(`projects.json entry ${index} has an unsafe ${key}.`);
  }
  return value;
}

function parseTech(value: unknown, index: number): TechItem[] {
  if (!Array.isArray(value)) throw new TypeError(`projects.json entry ${index} has invalid tech.`);
  return value.map((item, techIndex) => {
    if (!item || typeof item !== 'object') {
      throw new TypeError(`projects.json entry ${index} has invalid tech item ${techIndex}.`);
    }
    const record = item as RawProject;
    return {
      name: requiredString(record, 'name', index),
      role: requiredString(record, 'role', index),
    };
  });
}

function parseBlogLinks(value: unknown, index: number): BlogLink[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new TypeError(`projects.json entry ${index} has invalid blog_posts.`);
  }
  return value.map((item, blogIndex) => {
    if (!item || typeof item !== 'object') {
      throw new TypeError(`projects.json entry ${index} has invalid blog post ${blogIndex}.`);
    }
    const record = item as RawProject;
    const url = externalUrl(record, 'url', index);
    if (!url) throw new TypeError(`projects.json entry ${index} has an empty blog post URL.`);
    return { title: requiredString(record, 'title', index), url };
  });
}

function imagePath(item: RawProject, index: number): string | undefined {
  const value = str(item['image_url']);
  if (value === undefined || value.length === 0) return undefined;
  if (
    !/^\/projects\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/.test(value) ||
    value.includes('..')
  ) {
    throw new TypeError(`projects.json entry ${index} has an unsafe image_url.`);
  }
  return value;
}

function parseProject(item: RawProject, index: number): Project {
  const orderRank = item['order_rank'];
  if (
    orderRank !== undefined &&
    orderRank !== null &&
    (typeof orderRank !== 'number' || !Number.isFinite(orderRank))
  ) {
    throw new TypeError(`projects.json entry ${index} has an invalid order_rank.`);
  }

  return {
    id: requiredString(item, 'objectID', index),
    title: requiredString(item, 'name', index),
    status: str(item['status']) ?? '',
    description: str(item['what_it_is']) ?? '',
    tech: parseTech(item['tech'], index),
    repo_url: externalUrl(item, 'repo_url', index),
    app_url: externalUrl(item, 'app_url', index),
    image_url: imagePath(item, index),
    image_alt: str(item['image_alt']),
    blog_posts: parseBlogLinks(item['blog_posts'], index),
    announcements: parseBlogLinks(item['announcements'], index),
    award: str(item['award']),
    order_rank: typeof orderRank === 'number' ? orderRank : 999,
  };
}

export function getProjects(): Project[] {
  return (rawProjects as RawProject[])
    .map((project, index) => parseProject(project, index))
    .sort((a, b) => a.order_rank - b.order_rank);
}
