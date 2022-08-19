FROM node:lts-alpine

WORKDIR /app
COPY . .

ENV HOST 0.0.0.0
EXPOSE 8080

CMD [ "yarn", "start:ui" ]
