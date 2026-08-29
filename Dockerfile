FROM node:26-bookworm-slim AS installer
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_LOGLEVEL=error

# Install with the lockfile first so this layer caches across source changes.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# .dockerignore excludes secrets, dependencies, and build output.
COPY . .

# Build-time public env — client-embedded, safe to bake in.
ARG NEXT_PUBLIC_ALGOLIA_APPLICATION_ID
ENV NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID

# NOSONAR(S6472) - public search-only key, intentionally client-embedded
ARG NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY

ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

ARG NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_SEARCH_INDEX_NAME

# `postbuild` folds .next/static and public into .next/standalone.
RUN npm run build

FROM node:26-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# The standalone tree is self-contained (traced node_modules + server.js), and
# postbuild already placed .next/static and public inside it.
# --chmod=555 (read+execute, no write) satisfies S6504.
COPY --from=installer --chown=node:node --chmod=555 /app/.next/standalone ./

USER node
CMD ["node", "server.js"]
