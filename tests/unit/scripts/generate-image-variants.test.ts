import { describe, expect, it, vi } from 'vitest';

const { generateImageVariants, isUpToDate, publicPathFor, variantWidths } =
  await import('../../../scripts/generate-image-variants.mjs');

function imageFactory(width = 500) {
  return vi.fn((file: string) => {
    const chain = {
      metadata: vi.fn(async () => ({ width })),
      modulate: vi.fn(() => chain),
      resize: vi.fn(() => chain),
      webp: vi.fn(() => ({ toBuffer: vi.fn(async () => Buffer.from(file)) })),
    };
    return chain;
  });
}

function filesystem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    mkdir: vi.fn(async () => undefined),
    readdir: vi.fn(async () => ['z.webp', 'ignore.png', 'a.webp']),
    readFile: vi.fn(async () => '{}'),
    rm: vi.fn(async () => undefined),
    stat: vi.fn(async () => {
      throw new Error('missing');
    }),
    writeFile: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('image variant generator', () => {
  it('creates a deterministic, clamped variant plan without touching real files', async () => {
    const fs = filesystem();
    const sharpFactory = imageFactory();
    const log = vi.fn();

    await expect(
      generateImageVariants({
        cwd: '/portfolio',
        fs,
        log,
        sharpFactory,
        sources: [{ dir: 'projects', files: null }],
      })
    ).resolves.toEqual({ status: 'written', variants: 4 });

    expect(fs.readdir).toHaveBeenCalledWith('/portfolio/public/projects');
    expect(fs.rm).toHaveBeenCalledWith('/portfolio/public/projects/opt', {
      force: true,
      recursive: true,
    });
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/portfolio/src/data/image-manifest.json',
      expect.stringContaining('"/projects/a.webp"')
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/portfolio/public/projects/opt/z-500.webp',
      expect.any(Buffer)
    );
    expect(log).toHaveBeenCalledWith('Wrote 4 variants for 2 sources');
  });

  it('skips only when the manifest exists, names match, and every input is older', async () => {
    const fs = filesystem({
      readFile: vi.fn(async () =>
        JSON.stringify({ '/projects/a.webp': {}, '/projects/z.webp': {} })
      ),
      stat: vi.fn(async () => ({ mtimeMs: 10 })),
    });
    const sharpFactory = imageFactory();

    await expect(
      generateImageVariants({
        cwd: '/portfolio',
        fs,
        log: vi.fn(),
        sharpFactory,
        sources: [{ dir: 'projects', files: null }],
      })
    ).resolves.toEqual({ status: 'current', variants: 0 });

    expect(sharpFactory).not.toHaveBeenCalled();
    expect(fs.rm).not.toHaveBeenCalled();
  });

  it('rebuilds for a missing, malformed, stale, or renamed manifest input', async () => {
    const expectedKeys = ['/projects/a.webp'];
    const argumentsFor = (readManifest: () => Promise<string>, sourceMtime = 20) => ({
      expectedKeys,
      outFile: '/manifest.json',
      readManifest,
      scriptPath: '/generator.mjs',
      sourcePaths: ['/projects/a.webp'],
      statFile: vi.fn(async (file: string) => ({
        mtimeMs: file === '/manifest.json' ? 10 : sourceMtime,
      })),
    });

    await expect(isUpToDate(argumentsFor(async () => '{'))).resolves.toBe(false);
    await expect(
      isUpToDate(argumentsFor(async () => JSON.stringify({ '/projects/renamed.webp': {} })))
    ).resolves.toBe(false);
    await expect(
      isUpToDate(argumentsFor(async () => JSON.stringify({ '/projects/a.webp': {} })))
    ).resolves.toBe(false);
    await expect(
      isUpToDate({
        ...argumentsFor(async () => JSON.stringify({ '/projects/a.webp': {} }), 5),
        statFile: vi.fn(async (file: string) => {
          if (file === '/manifest.json') throw new Error('missing');
          return { mtimeMs: 5 };
        }),
      })
    ).resolves.toBe(false);
  });

  it('rejects invalid image metadata instead of writing a broken manifest', async () => {
    const fs = filesystem();
    const sharpFactory = imageFactory(null as unknown as number);

    await expect(
      generateImageVariants({
        cwd: '/portfolio',
        fs,
        log: vi.fn(),
        sharpFactory,
        sources: [{ dir: '', files: ['profile.webp'] }],
      })
    ).rejects.toThrow('Missing width metadata for /portfolio/public/profile.webp');

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('keeps public paths and width boundaries deterministic', () => {
    expect(publicPathFor('', 'profile.webp')).toBe('/profile.webp');
    expect(publicPathFor('projects', 'alpha.webp')).toBe('/projects/alpha.webp');
    expect(variantWidths(150)).toEqual([150]);
    expect(variantWidths(500)).toEqual([448, 500]);
    expect(variantWidths(1200)).toEqual([448, 768, 896]);
    expect(variantWidths(500, [448, 448, 896])).toEqual([448, 500]);
  });
});
