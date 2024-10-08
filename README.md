# LINE Notify API has been deprecated and set to sunset on March 31, 2025

## Notice-Manager Web GUI

![Build (main)](https://img.shields.io/github/actions/workflow/status/dvgamerr-app/notice-manager/notice.yml?style=flat-square)
![Codacy (main)](https://img.shields.io/codacy/grade/3ec9018fd0994796b64484495342a131/main?style=flat-square)
![last commit (main)](https://img.shields.io/github/last-commit/dvgamerr-app/notice-manager/main.svg?style=flat-square)
![MIT](https://img.shields.io/dub/l/vibe-d.svg?style=flat-square)
![Node](https://img.shields.io/badge/node-apline-green?style=flat-square)

![notify](./docs/cover.jpg)

This is a template to help you if you want to implement Line Notify. It help us follow:

- Authenication with Line Notify server
- Help you to access token from Line Notify server
- A notify entry point to notify Line Notify server

### Just want to try it?
- Build Container with UI and API
```bash
docker pull dvgamerr/notice:latest
docker run --rm -p 3000:3000 -v db-notice:/db -e SQLITE_PATH=/db/notice.db dvgamerr/notice:latest
```

#### Development
```bash
bun i
bun --watch index.js | pino-pretty
```

## UI Sample

| Notify                                   | Room                                 | Detail                                   |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------- |
| ![notify](./docs/liff-notify.webp) | ![room](./docs/liff-room.webp) | ![detail](./docs/liff-detail.webp) |
