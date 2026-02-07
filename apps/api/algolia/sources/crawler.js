new Crawler({
  appId: 'EXKENZ9FHJ',
  apiKey: 'b64818d18623f622291609230cb797dd',
  indexPrefix: '',
  rateLimit: 8,
  startUrls: ['https://crawly.checkmarkdevtools.dev/'],
  sitemaps: ['https://crawly.checkmarkdevtools.dev/sitemap.xml'],
  saveBackup: false,
  crawlerLogsEnabled: true,
  ignoreQueryParams: ['source', 'utm_*'],
  ignoreCanonicalTo: true,
  actions: [
    {
      indexName: 'crawly_posts',
      pathsToMatch: ['https://crawly.checkmarkdevtools.dev/posts/**'],
      recordExtractor: function ({ url, $, helpers }) {
        var urlStr = typeof url === 'string' ? url : String(url);

        var title =
          $('main > h1').first().text().trim() || $('title').first().text().trim() || urlStr;

        var description = $('meta[name="description"]').attr('content');
        description = description ? String(description).trim() : null;

        var publishedAt = $('meta[name="article:published_time"]').attr('content');
        publishedAt = publishedAt ? String(publishedAt).trim() : null;

        var canonical =
          $('link[rel="canonical"]').attr('href') || $('meta[name="canonical"]').attr('content');
        canonical = canonical ? String(canonical).trim() : null;

        var finalUrl = canonical || urlStr;

        var image = $('meta[property="og:image"]').attr('content');
        image = image ? String(image).trim() : null;

        var keywords = $('meta[name="keywords"]').attr('content');
        var tags = [];
        if (keywords) {
          tags = String(keywords)
            .split(',')
            .map(function (t) {
              return t.trim();
            })
            .filter(function (t) {
              return !!t;
            })
            .map(function (t) {
              return 'DEV Blog > #' + t;
            });
        }

        var engagementRaw = $('meta[name="devto:engagement_score"]').attr('content');
        var engagementScore = engagementRaw ? Number(engagementRaw) : 0;

        var signal = 0;
        if (isFinite(engagementScore)) {
          signal = Math.min(5, (5 * engagementScore) / 40);
        }

        if (signal < 1) {
          signal = 2;
        }

        var content = $('main article').first().text();
        content = content ? String(content).replace(/\s+/g, ' ').trim() : '';
        var blurb = content.substring(0, 1000);
        if (content.length > 1000) {
          blurb += '...';
        }

        return [
          {
            objectID: finalUrl,
            title: title,
            url: finalUrl,
            blurb: blurb,
            fact: description,
            'tags.lvl0': ['DEV Blog'],
            'tags.lvl1': tags,
            projects: [],
            category: 'Writing',
            signal: signal,
            publishedAt: publishedAt,
          },
        ];
      },
    },
  ],
  initialIndexSettings: {
    crawly_posts: {
      distinct: true,
      attributeForDistinct: 'objectIDs',
      searchableAttributes: [
        'unordered(title)',
        'unordered(fact)',
        'unordered(blurb)',
        'tags.lvl1',
      ],
      customRanking: ['desc(signal)', 'desc(publishedAt)'],
      attributesForFaceting: ['type', 'tags'],
    },
  },
});
