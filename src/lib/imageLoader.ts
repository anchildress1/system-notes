// A module rather than a `loader` prop because a server component cannot pass a function
// across the client boundary. loaderFile needs a default export.
export { projectImageLoader as default } from '@/lib/imageVariants';
