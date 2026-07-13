/**
 * Algolia facet attribute → user-facing label.
 *
 * Strips hierarchical suffixes (e.g. `tags.lvl0`), splits camelCase/snake_case,
 * lowercases, and singularizes. Used to derive filter dropdown labels from
 * whatever attributes the index exposes via `renderingContent.facetOrdering`.
 */
export function humanizeAttribute(attribute: string): string {
  const base = attribute.replace(/\.lvl\d+$/, '');
  const words = base
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('.')
    .pop()!
    .toLowerCase()
    .trim();
  return singularize(words);
}

function singularize(word: string): string {
  if (/(ches|shes|sses|xes|zes)$/i.test(word)) return word.replace(/es$/i, '');
  if (/[^aeiou]ies$/i.test(word)) return word.replace(/ies$/i, 'y');
  if (/[^s]s$/i.test(word)) return word.replace(/s$/i, '');
  return word;
}
