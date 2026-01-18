# Block 1: The Pruner
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .

RUN npx turbo prune --scope=web --docker

# Block 2: The Installer
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat git
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Set LEFTHOOK=0 to ensure it doesn't try to install hooks
# Use --ignore-scripts to prevent postinstall scripts from running
RUN LEFTHOOK=0 npm install --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN npx turbo run build --filter=web...

# Block 3: The Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/web/next.config.ts .
COPY --from=installer /app/apps/web/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js
