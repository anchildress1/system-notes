# Block 1: The Pruner
FROM node:20-bookworm-slim AS pruner
WORKDIR /app
COPY . .
RUN npm install -g turbo@2.8.1
RUN turbo prune --scope=web --docker

# Block 2: The Installer
FROM node:20-bookworm-slim AS installer
RUN apt-get update && apt-get install -y git build-essential python3
WORKDIR /app

# First install the dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Set LEFTHOOK=0 to ensure it doesn't try to install hooks
RUN LEFTHOOK=0 npm install --legacy-peer-deps

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Ensure build env vars are set

ARG NEXT_PUBLIC_ALGOLIA_APPLICATION_ID
ENV NEXT_PUBLIC_ALGOLIA_APPLICATION_ID=$NEXT_PUBLIC_ALGOLIA_APPLICATION_ID

ARG NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY

ARG NEXT_PUBLIC_ALGOLIA_AGENT_ID
ENV NEXT_PUBLIC_ALGOLIA_AGENT_ID=$NEXT_PUBLIC_ALGOLIA_AGENT_ID

RUN npm run build -- --filter=web

# Block 3: The Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run production as root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/web/next.config.ts .
COPY --from=installer /app/apps/web/package.json .

# Copy standalone build
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD ["node", "apps/web/server.js"]
