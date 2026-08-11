// Wired in via images.loaderFile. A default export is the only shape Next accepts
// there, and it has to be a module rather than a `loader` prop so server components
// (Portrait) can use it without passing a function across the client boundary.
export { projectImageLoader as default } from '@/lib/imageVariants';
