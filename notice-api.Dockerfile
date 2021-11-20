# ARG ARCH=arm32v7
# FROM ${ARCH}/node:lts-alpine
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production

WORKDIR /app
COPY api index.js package.json yarn.lock ./

RUN yarn

CMD ["yarn", "start:api"]
