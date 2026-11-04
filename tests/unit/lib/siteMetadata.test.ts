import { describe, expect, it } from 'vitest';
import { buildPageMetadata, SITE_NAME, SOCIAL_IMAGE, SOCIAL_IMAGE_URL } from '@/lib/siteMetadata';

describe('page metadata', () => {
  it('builds page-specific social metadata without losing shared image fields', () => {
    expect(
      buildPageMetadata({
        title: 'About | System Notes',
        description: 'The person.',
        path: '/about',
        type: 'profile',
      })
    ).toMatchObject({
      title: { absolute: 'About | System Notes' },
      alternates: { canonical: '/about' },
      openGraph: {
        type: 'profile',
        url: '/about',
        siteName: SITE_NAME,
        images: [SOCIAL_IMAGE],
      },
      twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE_URL] },
    });
  });

  it('defaults ordinary pages to website metadata', () => {
    expect(
      buildPageMetadata({ title: 'Projects', description: 'Work.', path: '/projects' }).openGraph
    ).toMatchObject({ type: 'website' });
  });
});
