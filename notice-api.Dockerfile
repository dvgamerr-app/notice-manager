
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production

WORKDIR /app

COPY . .

CMD ["yarn", "start"]
