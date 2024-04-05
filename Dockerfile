FROM oven/bun:alpine
WORKDIR /app

RUN apk add libstdc++

# ENV SQLITE_PATH=/db/notice.db

COPY . .

RUN bun i

EXPOSE 3000/tcp
ENTRYPOINT ["bun", "start"]
