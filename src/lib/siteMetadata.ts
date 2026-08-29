import type { Metadata } from 'next';

export const SITE_NAME = 'System Notes';
export const SOCIAL_IMAGE_URL = '/projects/system-notes.webp';
export const SOCIAL_IMAGE = {
  url: SOCIAL_IMAGE_URL,
  width: 1440,
  height: 720,
  alt: 'System Notes, an engineering decision index by Ashley Childress',
} as const;

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  type?: 'article' | 'profile' | 'website';
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = 'website',
}: PageMetadataInput): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SOCIAL_IMAGE_URL],
    },
  };
}
