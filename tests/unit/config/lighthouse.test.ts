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
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

describe('Lighthouse profiles', () => {
  it('collects and asserts without publishing test reports or GitHub status', async () => {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['test:perf']).toContain('lhci collect');
    expect(packageJson.scripts['test:perf']).toContain('lhci assert');
    expect(packageJson.scripts['test:perf']).not.toContain('lhci autorun');
    expect(packageJson.scripts['test:perf']).not.toContain('lhci upload');
  });

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
