# Block 1: The Installer
FROM node:20-bookworm-slim AS installer
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_LOGLEVEL=error

# Install with the lockfile first so this layer caches across source changes.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# .dockerignore excludes .env and secrets; node_modules/.next stay out too (S6470 reviewed SAFE)
COPY . .

# Build-time public env — client-embedded, safe to bake in.
ARG NEXT_PUBLIC_ALGOLIA_APPLICATION_ID
ENV NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID

# NOSONAR(S6472) - public search-only key, intentionally client-embedded
ARG NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY

ARG NEXT_PUBLIC_ALGOLIA_AGENT_ID
ENV NEXT_PUBLIC_ALGOLIA_AGENT_ID=$NEXT_PUBLIC_ALGOLIA_AGENT_ID

ARG NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID=$NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID

ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

ARG NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME

ARG NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME
ENV NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SUGGESTIONS_INDEX_NAME

# `postbuild` folds .next/static and public into .next/standalone.
RUN npm run build

# Block 2: The Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run production as root
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --create-home --shell /usr/sbin/nologin nextjs

# The standalone tree is self-contained (traced node_modules + server.js), and
# postbuild already placed .next/static and public inside it.
# --chmod=555 (read+execute, no write) satisfies S6504.
COPY --from=installer --chown=nextjs:nodejs --chmod=555 /app/.next/standalone ./

# next/image writes optimized images to .next/cache/images at runtime. The rest
# of the tree is read-only (S6504); carve out one writable, nextjs-owned dir so
# the optimizer doesn't EACCES on mkdir. Done as root before dropping user.
RUN mkdir -p .next/cache \
    && chown nextjs:nodejs .next/cache \
    && chmod 700 .next/cache

USER nextjs
CMD ["node", "server.js"]
