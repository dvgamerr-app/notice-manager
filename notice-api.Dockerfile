
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production

WORKDIR /app

EXPOSE 3000

COPY . .

RUN npm i -g pnpm \
  && pnpm i --prod

CMD ["node", "index.js"]
