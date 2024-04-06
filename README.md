## Notice-Manager Web GUI

![Build (main)](https://img.shields.io/github/workflow/status/dvgamerr-app/notice-manager/notice/main?style=flat-square)
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
- Download and Install [Rancher Desktop](https://rancherdesktop.io/)
- Build Container with UI and API
```
docker build -e BASE_URL=http://localhost/ -f notice-api.Dockerfile -t notice-api:latest .
docker build -e BASE_URL=http://localhost/ -f notice-ui.Dockerfile -t notice-ui:latest .

kubectl apply -f deployments.yaml
```

## UI Sample

| Notify                                   | Room                                 | Detail                                   |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------- |
| ![notify](./src/assets/liff-notify.webp) | ![room](./src/assets/liff-room.webp) | ![detail](./src/assets/liff-detail.webp) |
