# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json bun.lockb ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

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
    PORT=3000

COPY package.json bun.lockb ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

COPY --chown=bun:bun index.js app.js ./
COPY --chown=bun:bun api ./api
COPY --chown=bun:bun lib ./lib
COPY --chown=bun:bun migrations ./migrations
COPY --from=build --chown=bun:bun /app/dist ./dist

RUN chown bun:bun /app
USER bun

EXPOSE 3000/tcp
CMD ["bun", "index.js"]
