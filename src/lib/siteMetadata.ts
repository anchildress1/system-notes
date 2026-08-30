import type { Metadata } from 'next';

export const SITE_NAME = 'System Notes';
/* The System Notes project card, shared as the site's own. WebP: checked against
   LinkedIn's Post Inspector, which scrapes it, renders the full card, and
   re-hosts a transcode on its own CDN. A JPEG duplicate was carried here for a
   while on the belief that it would not — it does. */
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
  /** Omitted for a route with no canonical address of its own, such as the 404. */
  path?: string;
  type?: 'article' | 'profile' | 'website';
}

/* Every route builds its social metadata HERE rather than declaring its own.
   Next merges `openGraph` and `twitter` shallowly, so a route that sets two
   fields replaces the layout's whole object and silently drops the image,
   siteName, locale, type and url with it. */
export function buildPageMetadata({
  title,
  description,
  path,
  type = 'website',
}: PageMetadataInput): Metadata {
  return {
    title: { absolute: title },
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      title,
      description,
      ...(path ? { url: path } : {}),
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
