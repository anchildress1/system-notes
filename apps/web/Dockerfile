# Block 1: The Pruner
FROM node:20-bookworm-slim AS pruner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_LOGLEVEL=error
# .dockerignore excludes .env and secrets; full tree needed for turbo prune (S6470 reviewed SAFE)
COPY . .
RUN npm exec --yes --package=turbo@2.9.15 -- turbo prune web --docker

# Block 2: The Installer
FROM node:20-bookworm-slim AS installer
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_LOGLEVEL=error

# First install the dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

RUN npm ci --omit=dev --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Ensure build env vars are set

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

RUN npm run build --workspace web

# Block 3: The Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run production as root
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --create-home --shell /usr/sbin/nologin nextjs

COPY --from=installer /app/apps/web/next.config.ts .
COPY --from=installer /app/apps/web/package.json .

# Copy standalone build — --chmod=555 (read+execute, no write) satisfies S6504
COPY --from=installer --chown=nextjs:nodejs --chmod=555 /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs --chmod=555 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs --chmod=555 /app/apps/web/public ./apps/web/public

# next/image writes optimized images to .next/cache/images at runtime. The rest
# of .next is read-only (S6504); carve out just this one writable, nextjs-owned
# dir so the optimizer doesn't EACCES on mkdir. Done as root before dropping user.
RUN mkdir -p apps/web/.next/cache \
    && chown nextjs:nodejs apps/web/.next/cache \
    && chmod 700 apps/web/.next/cache

USER nextjs
CMD ["node", "apps/web/server.js"]
