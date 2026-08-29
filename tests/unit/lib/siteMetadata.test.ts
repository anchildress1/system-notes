import { describe, expect, it } from 'vitest';
import { buildPageMetadata, SITE_NAME, SOCIAL_IMAGE, SOCIAL_IMAGE_URL } from '@/lib/siteMetadata';

describe('page metadata', () => {
  it('builds page-specific social metadata without losing shared image fields', () => {
    expect(
      buildPageMetadata({
        title: 'A note | System Notes',
        description: 'The useful bit.',
        path: '/notes/card:test:1',
        type: 'article',
      })
    ).toMatchObject({
      title: { absolute: 'A note | System Notes' },
      alternates: { canonical: '/notes/card:test:1' },
      openGraph: {
        type: 'article',
        url: '/notes/card:test:1',
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
