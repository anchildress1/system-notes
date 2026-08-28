import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const deployScript = path.resolve(process.cwd(), 'deploy.sh');
const temporaryDirectories: string[] = [];

async function fakeCloud(status = 'SUCCESS') {
  const directory = await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-'));
  temporaryDirectories.push(directory);
  const log = path.join(directory, 'gcloud.log');
  const binary = path.join(directory, 'gcloud');
  await writeFile(
    binary,
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GCLOUD_LOG"
case "$*" in
  "config get-value project") printf '%s\\n' 'test-project' ;;
  "config get-value account") printf '%s\\n' 'test@example.com' ;;
  "projects describe "*) printf '%s\\n' '123456789' ;;
  "beta builds submit "*) printf '%s\\n' 'build-123' ;;
  "builds describe "*) printf '%s\\n' '${status}' ;;
  "run services describe "*) printf '%s\\n' 'active-revision' ;;
  "run revisions list "*) printf '%s\\n' $'active-revision\\nstale-revision' ;;
esac
`
  );
  await chmod(binary, 0o755);
  return { directory, log };
}

async function runDeploy(env: Record<string, string>) {
  return run('/bin/bash', [deployScript], {
    cwd: await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-cwd-')),
    env: { ...process.env, ...env },
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('deploy script', () => {
  it('fails before deployment when gcloud is unavailable', async () => {
    await expect(
      runDeploy({
        PATH: '/does-not-exist',
        NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'app',
        NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'key',
      })
    ).rejects.toMatchObject({ stderr: expect.stringContaining('gcloud CLI is not installed') });
  });

  it('rejects a missing required public search key', async () => {
    const cloud = await fakeCloud();

    await expect(
      runDeploy({
        PATH: `${cloud.directory}:${process.env.PATH}`,
        GCLOUD_LOG: cloud.log,
        NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'TESTAPPID1',
        NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: '',
      })
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY'),
    });
  });

  it('wires public settings through a successful fake deployment and keeps the active revision', async () => {
    const cloud = await fakeCloud();
    const cwd = await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-cwd-'));
    temporaryDirectories.push(cwd);

    await run('/bin/bash', [deployScript], {
      cwd,
      env: {
        ...process.env,
        PATH: `${cloud.directory}:${process.env.PATH}`,
        GCLOUD_LOG: cloud.log,
        GCP_PROJECT_ID: 'test-project',
        NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'TESTAPPID1',
        NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'test_search_key_valid_length_20',
        NEXT_PUBLIC_ALGOLIA_AGENT_ID: 'agent-123',
      },
    });

    const calls = await readFile(cloud.log, 'utf8');
    expect(calls).toContain('_NEXT_PUBLIC_ALGOLIA_AGENT_ID=agent-123');
    expect(calls).toContain('run deploy system-notes');
    expect(calls).toContain('run revisions delete stale-revision');
    expect(calls).not.toContain('run revisions delete active-revision');
  });

  it('surfaces a terminal Cloud Build failure without deploying', async () => {
    const cloud = await fakeCloud('FAILURE');
    const cwd = await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-cwd-'));
    temporaryDirectories.push(cwd);

    await expect(
      run('/bin/bash', [deployScript], {
        cwd,
        env: {
          ...process.env,
          PATH: `${cloud.directory}:${process.env.PATH}`,
          GCLOUD_LOG: cloud.log,
          GCP_PROJECT_ID: 'test-project',
          NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'TESTAPPID1',
          NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'test_search_key_valid_length_20',
        },
      })
    ).rejects.toMatchObject({ stderr: expect.stringContaining('build-123 failed: FAILURE') });

    expect(await readFile(cloud.log, 'utf8')).not.toContain('run deploy');
  });
});
