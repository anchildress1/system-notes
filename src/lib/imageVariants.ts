import manifest from '@/data/image-manifest.json';

interface Variant {
  blur: string;
  widths: number[];
}

const variants: Record<string, Variant> = manifest;

/**
 * Rewrites a public image path to the pre-rendered variant at or above `width`.
 * Falls back to the original path for any source the generator does not cover.
 */
export function projectImageLoader({ src, width }: { src: string; width: number }): string {
  const entry = variants[src];
  if (!entry) return src;

  const rung = entry.widths.find((w) => w >= width) ?? entry.widths.at(-1);

  const slash = src.lastIndexOf('/');
  const dir = src.slice(0, slash);
  const base = src.slice(slash + 1).replace(/\.webp$/, '');
  return `${dir}/opt/${base}-${rung}.webp`;
}

/** Base64 LQIP for a public image path, or undefined when none was generated. */
export function blurFor(src: string | undefined): string | undefined {
  return src ? variants[src]?.blur : undefined;
}
