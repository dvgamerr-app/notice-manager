FROM oven/bun:debian as base
WORKDIR /usr/src/app

COPY . .

RUN apt update && apt upgrade -y && apt-get install lib32stdc++6 -y && bun i

# FROM oven/bun:alpine AS release

# COPY --from=base /usr/src/app .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "start"]
