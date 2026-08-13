// A module rather than a `loader` prop because Portrait is a server component and
// cannot pass a function across the client boundary. loaderFile needs a default export.
export { projectImageLoader as default } from '@/lib/imageVariants';
