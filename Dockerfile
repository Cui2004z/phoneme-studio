# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM dependencies AS builder
COPY . .
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build && npm prune --omit=dev \
    && rm -rf .next/standalone/node_modules

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/studio.db
# Retain Prisma CLI in production to apply versioned migrations at startup.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/data && chown node:node /app/data && chmod +x ./docker-entrypoint.sh
USER node
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
