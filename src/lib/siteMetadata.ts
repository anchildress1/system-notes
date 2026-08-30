import type { Metadata } from 'next';

export const SITE_NAME = 'System Notes';
/* JPEG, not the WebP the rest of the site serves. LinkedIn documents JPG, PNG and
   GIF for og:image and commonly renders no preview at all for WebP — and a link
   with no card is the one place this site cannot afford to look broken. Same
   source art at the same 1440x720; a PNG of it was 443 KiB against this 169. */
export const SOCIAL_IMAGE_URL = '/projects/system-notes.jpg';
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
