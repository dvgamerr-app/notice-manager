FROM node:lts AS builder
LABEL MAINTAINER="Kananek T."

WORKDIR /app
COPY . /app

RUN npm i

ENV TZ Asia/Bangkok
ENV PROXY_API https://notice.touno.io
ENV HOST_API https://notice.touno.io
ENV AXIOS_BASE_URL https://notice.touno.io

RUN npm run build
RUN rm -Rf ./.github \
  ./assets \
  ./components \
  ./docs \
  ./layouts \
  ./pages \
  ./node_modules

FROM node:lts-alpine
LABEL MAINTAINER="Kananek T."

ENV TZ Asia/Bangkok
ENV NODE_ENV production
ENV PROXY_API https://notice.touno.io
ENV HOST_API https://notice.touno.io
ENV AXIOS_BASE_URL https://notice.touno.io

WORKDIR /app
COPY --from=builder /app .
RUN npm i --production

CMD ["npm", "run", "start:ui"]

# FROM golang:1.7.3 AS builder
# WORKDIR /go/src/github.com/alexellis/href-counter/
# RUN go get -d -v golang.org/x/net/html  
# COPY app.go    .
# RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .
