
FROM node:lts-alpine

LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production

WORKDIR /app

EXPOSE 3000

COPY . .

CMD ["node", "index.js"]
