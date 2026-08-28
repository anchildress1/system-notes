import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const profiles = [
  {
    file: 'lighthouserc.mobile.json',
    routes: [
      'http://localhost:3001/',
      'http://localhost:3001/projects',
      'http://localhost:3001/about',
    ],
  },
  {
    file: 'lighthouserc.desktop.json',
    routes: [
      'http://localhost:3003/',
      'http://localhost:3003/projects',
      'http://localhost:3003/about',
    ],
  },
] as const;

describe('Lighthouse profiles', () => {
  it.each(profiles)('fails console errors in $file', async ({ file, routes }) => {
    const config = JSON.parse(await readFile(path.resolve(process.cwd(), file), 'utf8')) as {
      ci: {
        assert: { assertions: Record<string, unknown> };
        collect: { numberOfRuns: number; settings: { skipAudits: string[] }; url: string[] };
      };
    };

    expect(config.ci.collect.url).toEqual(routes);
    expect(config.ci.collect.numberOfRuns).toBe(3);
    expect(config.ci.collect.settings.skipAudits).toEqual(['uses-http2']);
    expect(config.ci.assert.assertions['errors-in-console']).toEqual([
      'error',
      { minScore: 1, aggregationMethod: 'pessimistic' },
    ]);
  });
});
