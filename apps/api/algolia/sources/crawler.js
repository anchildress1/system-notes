// Avoid hardcoding credentials in source. Prefer providing via environment
// variables and never commit real API keys or app IDs to the repo or terminal.
new Crawler({
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || 'REDACTED_APP_ID',
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

        var title =
          $('main > h1').first().text().trim() || $('title').first().text().trim() || urlStr;

        var _desc = $('meta[name="description"]').attr('content');
        var description = _desc ? String(_desc).trim().slice(0, 500) : null;

        var publishedAt = $('meta[name="article:published_time"]').attr('content');
        var epochTimestamp = null;
        if (publishedAt) {
          var date = new Date(String(publishedAt).trim());
          if (!isNaN(date.getTime())) {
            epochTimestamp = Math.floor(date.getTime() / 1000);
          }
        }

        var canonical =
          $('link[rel="canonical"]').attr('href') ||
          $('meta[property="og:url"]').attr('content') ||
          $('meta[property="source-url"]').attr('content');
        canonical = canonical ? String(canonical).trim() : null;

        // Always use canonical if available, otherwise fall back to crawled URL
        var finalUrl = canonical || urlStr;

        // Guard against empty URLs
        if (!finalUrl || finalUrl.trim() === '') {
          console.warn('Empty URL found for page, skipping record');
          return [];
        }

        // Extract slug for objectID - use last URL segment or hash the full URL
        var slug = '';
        var cleanUrl = finalUrl.replace(/\/$/, '').replace(/^https?:\/\//, '');
        var parts = cleanUrl.split('/');
        if (parts.length > 1) {
          // Get last non-empty segment
          slug =
            parts
              .filter(function (p) {
                return p.length > 0;
              })
              .pop() || '';
        }

        // Fallback: if slug is still empty, use a hash of the URL
        if (!slug || slug.trim() === '') {
          var hash = 0;
          for (var i = 0; i < finalUrl.length; i++) {
            var char = finalUrl.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          slug = 'post-' + Math.abs(hash).toString(36);
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
        // Map dev.to engagement_score (0-615 range) to signal scale (1-5).
        // 615 is the maximum expected engagement score. Posts with zero engagement are dropped.
        var rawScore = engagementRaw ? Number(engagementRaw) : 0;
        if (rawScore === 0) return [];
        // Map to 1-5 scale: divide by 123 (615/5) and ceil to ensure minimum of 1
        var engagementScore = Math.min(5, Math.max(1, Math.ceil(rawScore / 123)));

        var _content = $('main article').first().text();
        var content = _content ? String(_content).trim().replace(/\s+/g, ' ') : null;
        // Cap content size to avoid Algolia "record too large" errors.
        if (content && content.length > 150) {
          content = content.slice(0, 150);
        }

        return [
          {
            title: title,
            url: finalUrl,
            blurb: description,
            fact: content,
            'tags.lvl0': ['DEV Blog'],
            'tags.lvl1': tags,
            projects: [],
            category: 'Writing',
            signal: engagementScore,
            created_at: epochTimestamp,
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
        'tags.lvl0',
        'searchable(tags.lvl1)',
      ],
      customRanking: ['desc(signal)', 'desc(created_at)'],
      hitsPerPage: 20,
      typoTolerance: true,
    },
  },
});
