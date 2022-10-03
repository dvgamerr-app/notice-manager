
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production
ENV BASE_URL http://localhost/

WORKDIR /app

COPY . .

CMD ["yarn", "start"]
