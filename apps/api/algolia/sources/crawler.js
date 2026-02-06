new Crawler({
  appId: 'EXKENZ9FHJ',
  apiKey: 'b64818d18623f622291609230cb797dd',
  indexPrefix: '',
  rateLimit: 8,
  maxUrls: 100,
  schedule: 'on thursday',
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

        var modifiedAt = $('meta[name="article:modified_time"]').attr('content');
        modifiedAt = modifiedAt ? String(modifiedAt).trim() : null;

        var canonical =
          $('link[rel="canonical"]').attr('href') || $('meta[name="canonical"]').attr('content');
        canonical = canonical ? String(canonical).trim() : null;

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
              return t.charAt(0) === '#' ? t : '#' + t;
            });
        }

        var engagementRaw = $('meta[name="devto:engagement_score"]').attr('content');
        var engagementScore = engagementRaw ? Number(engagementRaw) : 0;
        const normalize = (score) => Math.min(5, (5 * score) / 50);

        if (!isFinite(engagementScore)) engagementScore = 0;

        var content = $('main article').first().text();
        content = content ? String(content).replace(/\s+/g, ' ').trim() : '';

        return [
          {
            objectID: urlStr,
            title: title,
            blurb: urlStr,
            fact: description,
            'tags.lvl0': ['DEV Blog'],
            'tags.lvl1': tags,
            projects: [],
            category: 'Writing',
            signal: normalize(engagementScore),
          },
        ];
      },
    },
    {
      indexName: 'crawly_pages',
      pathsToMatch: ['https://crawly.checkmarkdevtools.dev/**'],
      recordExtractor: function ({ url, $, helpers, contentLength, fileType }) {
        var urlStr = typeof url === 'string' ? url : String(url);
        if (urlStr.indexOf('/posts/') !== -1) return [];
        return helpers.page({ $, url, contentLength, fileType });
      },
    },
  ],
  initialIndexSettings: {
    crawly_posts: {
      distinct: true,
      attributeForDistinct: 'objectIDs',
      searchableAttributes: ['unordered(title)', 'unordered(fact)', 'tags.lvl1'],
      customRanking: ['desc(engagementScore)', 'desc(publishedAt)'],
      attributesForFaceting: ['type', 'tags'],
    },
  },
});
