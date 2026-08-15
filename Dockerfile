FROM oven/bun:alpine
WORKDIR /app

RUN apk add libstdc++

# ENV SQLITE_PATH=/db/notice.db

COPY . .

RUN bun install --frozen-lockfile
RUN bun run build:ui

EXPOSE 3000/tcp
ENTRYPOINT ["bun", "start"]
