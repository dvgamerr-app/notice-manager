# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM dependencies AS build
ARG VITE_LIFF_ID=""
ARG VITE_API_URL=""
ENV VITE_LIFF_ID=${VITE_LIFF_ID} \
    VITE_API_URL=${VITE_API_URL}

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN bun run build:ui

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

RUN apk upgrade --no-cache

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=sqlite:///data/notice-manager.sqlite

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production --omit=peer --ignore-scripts

COPY --chown=bun:bun index.js app.js ./
COPY --chown=bun:bun api ./api
COPY --chown=bun:bun lib ./lib
COPY --chown=bun:bun migrations ./migrations
COPY --from=build --chown=bun:bun /app/dist ./dist

RUN mkdir -p /data && chown bun:bun /app /data
# hadolint ignore=DL3066
USER bun

# Default SQLite database lives here; mount a volume to persist it.
VOLUME /data
EXPOSE 3000/tcp
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["bun", "index.js"]
