import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const run = promisify(execFile);
const deployScript = path.resolve(process.cwd(), 'deploy.sh');
const temporaryDirectories: string[] = [];

async function writeExecutable(directory: string, name: string, source: string) {
  const file = path.join(directory, name);
  await writeFile(file, source);
  await chmod(file, 0o755);
}

async function fakeCloud(statuses = ['SUCCESS']) {
  const directory = await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-'));
  temporaryDirectories.push(directory);

  const log = path.join(directory, 'gcloud.log');
  const clock = path.join(directory, 'clock');
  const sleepLog = path.join(directory, 'sleep.log');
  const statusFile = path.join(directory, 'statuses');
  const statusIndex = path.join(directory, 'status-index');

  await Promise.all([
    writeFile(clock, '0\n'),
    writeFile(sleepLog, ''),
    writeFile(statusFile, `${statuses.join('\n')}\n`),
    writeFile(statusIndex, '0\n'),
  ]);

  await writeExecutable(
    directory,
    'gcloud',
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$GCLOUD_LOG"
case "$*" in
  "config get-value project") printf '%s\\n' 'test-project' ;;
  "config get-value account") printf '%s\\n' 'test@example.com' ;;
  "projects describe "*) printf '%s\\n' '123456789' ;;
  "beta builds submit "*) printf '%s\\n' 'build-123' ;;
  "builds describe "*)
    index=$(cat "$GCLOUD_STATUS_INDEX_FILE")
    line=$((index + 1))
    status=$(sed -n "\${line}p" "$GCLOUD_STATUS_FILE")
    if [[ -z "$status" ]]; then status=$(tail -n 1 "$GCLOUD_STATUS_FILE"); fi
    printf '%s\\n' "$line" > "$GCLOUD_STATUS_INDEX_FILE"
    printf '%s\\n' "$status"
    ;;
  "run services describe "*) printf '%s\\n' 'active-revision' ;;
  "run revisions list "*) printf '%s\\n' $'active-revision\\nstale-revision' ;;
esac
`
  );
  await writeExecutable(
    directory,
    'date',
    `#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == '+%s' ]]
cat "$CLOCK_FILE"
`
  );
  await writeExecutable(
    directory,
    'sleep',
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$1" >> "$SLEEP_LOG"
now=$(cat "$CLOCK_FILE")
printf '%s\\n' "$((now + $1))" > "$CLOCK_FILE"
`
  );

  return { clock, directory, log, sleepLog, statusFile, statusIndex };
}

function deploymentEnv(
  cloud: Awaited<ReturnType<typeof fakeCloud>>,
  overrides: Record<string, string> = {}
) {
  return {
    ...process.env,
    PATH: `${cloud.directory}:${process.env.PATH}`,
    CLOCK_FILE: cloud.clock,
    GCLOUD_LOG: cloud.log,
    GCLOUD_STATUS_FILE: cloud.statusFile,
    GCLOUD_STATUS_INDEX_FILE: cloud.statusIndex,
    SLEEP_LOG: cloud.sleepLog,
    GCP_PROJECT_ID: 'test-project',
    NEXT_PUBLIC_ALGOLIA_APPLICATION_ID: 'TESTAPPID1',
    NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: 'test_search_key_valid_length_20',
    ...overrides,
  };
}

async function runDeploy(env: Record<string, string>) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'system-notes-deploy-cwd-'));
  temporaryDirectories.push(cwd);
  return run('/bin/bash', [deployScript], { cwd, env });
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
      runDeploy(deploymentEnv(cloud, { NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: '' }))
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY'),
    });
  });

  it('wires public settings through a successful fake deployment and keeps the active revision', async () => {
    const cloud = await fakeCloud();

    await runDeploy(deploymentEnv(cloud, { NEXT_PUBLIC_ALGOLIA_AGENT_ID: 'agent-123' }));

    const calls = await readFile(cloud.log, 'utf8');
    expect(calls).toContain('_NEXT_PUBLIC_ALGOLIA_AGENT_ID=agent-123');
    expect(calls).toContain('run deploy system-notes');
    expect(calls).toContain('run revisions delete stale-revision');
    expect(calls).not.toContain('run revisions delete active-revision');
    expect(await readFile(cloud.sleepLog, 'utf8')).toBe('');
  });

  it('polls queued builds with the fake clock until they succeed', async () => {
    const cloud = await fakeCloud(['QUEUED', 'WORKING', 'SUCCESS']);

    const { stdout } = await runDeploy(deploymentEnv(cloud, { BUILD_TIMEOUT: '45' }));

    expect(stdout).toContain('Build build-123: QUEUED — waiting... (0s/45s)');
    expect(stdout).toContain('Build build-123: WORKING — waiting... (15s/45s)');
    expect(stdout).toContain('Build build-123 succeeded');
    expect(await readFile(cloud.statusIndex, 'utf8')).toBe('3\n');
    expect(await readFile(cloud.sleepLog, 'utf8')).toBe('15\n15\n');
  });

  it('times out queued builds with the fake clock before deployment', async () => {
    const cloud = await fakeCloud(['QUEUED']);

    await expect(runDeploy(deploymentEnv(cloud, { BUILD_TIMEOUT: '30' }))).rejects.toMatchObject({
      stderr: expect.stringContaining('Build build-123 timed out after 30s (status: QUEUED)'),
    });

    expect(await readFile(cloud.statusIndex, 'utf8')).toBe('2\n');
    expect(await readFile(cloud.sleepLog, 'utf8')).toBe('15\n15\n');
    expect(await readFile(cloud.log, 'utf8')).not.toContain('run deploy');
  });

  it('surfaces a terminal Cloud Build failure without deploying', async () => {
    const cloud = await fakeCloud(['FAILURE']);

    await expect(runDeploy(deploymentEnv(cloud))).rejects.toMatchObject({
      stderr: expect.stringContaining('build-123 failed: FAILURE'),
    });

    expect(await readFile(cloud.log, 'utf8')).not.toContain('run deploy');
    expect(await readFile(cloud.sleepLog, 'utf8')).toBe('');
  });
});
