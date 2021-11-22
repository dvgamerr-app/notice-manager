
# ARG ARCH=arm32v7
# FROM ${ARCH}/node:lts AS builder
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

WORKDIR /app
COPY . /app

RUN yarn && yarn build

CMD ["yarn", "start:ui"]
