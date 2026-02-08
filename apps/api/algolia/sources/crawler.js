new Crawler({
  appId: '3Q79SRC1FP',
  apiKey: process.env.ALGOLIA_CRAWLER_API_KEY,
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

        var _rawTitle =
          $('main > h1').first().text().trim() || $('title').first().text().trim() || urlStr;
        var title = 'Blog titled ' + _rawTitle;

        var _desc = $('meta[name="description"]').attr('content');
        var description = _desc ? String(_desc).trim().slice(0, 500) : null;

        var publishedAt = $('meta[name="article:published_time"]').attr('content');
        publishedAt = publishedAt ? String(publishedAt).trim() : null;

        var canonical =
          $('link[rel="canonical"]').attr('href') ||
          $('meta[name="og:url"]').attr('content') ||
          $('meta[name="source-url"]').attr('content');
        canonical = canonical ? String(canonical).trim() : null;

        var finalUrl = canonical || urlStr;

        var slug = finalUrl;
        var cleanUrl = finalUrl.replace(/\/$/, '');
        var parts = cleanUrl.split('/');
        if (parts.length > 0) {
          slug = parts.pop();
        }

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
        var engagementScore = engagementRaw ? Number(engagementRaw) - 1 : 0;

        if (engagementScore < 0) {
          engagementScore = 0;
        } else if (engagementScore > 5) {
          engagementScore = 5;
        }
        if (engagementScore === 0) {
          return [];
        }

        var _content = $('main article').first().text();
        var content = _content ? String(_content).trim().replace(/\s+/g, ' ') : null;
        // Cap content size to avoid Algolia "record too large" errors.
        if (content && content.length > 1000) {
          content = content.slice(0, 1000);
        }

        return [
          {
            objectID: slug,
            title: title,
            url: finalUrl,
            blurb: description,
            fact: content,
            'tags.lvl0': ['DEV Blog'],
            'tags.lvl1': tags,
            projects: [],
            category: 'Writing',
            signal: engagementScore,
            created_at: publishedAt,
          },
        ];
      },
    },
  ],
  initialIndexSettings: {
    crawly_posts: {
      distinct: true,
      attributeForDistinct: 'objectIDs',
      searchableAttributes: ['title', 'blurb', 'fact', 'projects', 'tags.lvl0', 'tags.lvl1'],
      attributesForFaceting: [
        'category',
        'searchable(projects)',
        'searchable(tags.lvl0)',
        'searchable(tags.lvl1)',
      ],
      customRanking: ['desc(signal)', 'desc(created_at)'],
      hitsPerPage: 20,
      typoTolerance: true,
    },
  },
});
