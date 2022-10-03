FROM node:lts-alpine

ENV BASE_URL http://localhost/

WORKDIR /app
COPY . .

ENV HOST 0.0.0.0
EXPOSE 8080

CMD [ "yarn", "start:ui" ]
