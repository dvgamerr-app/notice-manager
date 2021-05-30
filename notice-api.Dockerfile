FROM node:lts-alpine
LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production

WORKDIR /app
COPY . /app

RUN npm i --production

CMD ["npm", "run", "start:api"]
