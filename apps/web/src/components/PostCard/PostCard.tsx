/**
 * PostCard is now a thin re-export of FactCard.
 * Both card types are identical — the only visual difference is whether
 * `hit.url` is present, which FactCard already handles conditionally.
 */
export { default } from '../FactCard/FactCard';
export type { FactHitRecord as PostHitRecord } from '../FactCard/FactCard';
