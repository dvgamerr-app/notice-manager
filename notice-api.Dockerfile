FROM node:lts-alpine
LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production
ENV PROXY_API http://localhost:8080
ENV HOST_API http://localhost:8080
ENV AXIOS_BASE_URL http://localhost:8080

WORKDIR /app
COPY . /app

RUN npm i --production

CMD ["npm", "run", "start:api"]
