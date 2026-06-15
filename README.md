## Notice-Manager Web GUI

![Build (main)](https://img.shields.io/github/actions/workflow/status/dvgamerr-app/notice-manager/notice.yml?style=flat-square)
![Codacy (main)](https://img.shields.io/codacy/grade/3ec9018fd0994796b64484495342a131/main?style=flat-square)
![last commit (main)](https://img.shields.io/github/last-commit/dvgamerr-app/notice-manager/main.svg?style=flat-square)
![MIT](https://img.shields.io/dub/l/vibe-d.svg?style=flat-square)
![Bun](https://img.shields.io/badge/runtime-bun-f9f1e1?style=flat-square)

![notify](./docs/cover.jpg)

LINE Bot webhook manager with LIFF web GUI — manage bots, rooms, and push flex messages.

**Stack**: Bun · Elysia · Kysely · PostgreSQL · better-auth · React + Vite + Tailwind CSS

### Quick Start

```bash
# env
DATABASE_URL=postgres://user:pass@localhost:5432/notice
PORT=3000

# install & run
bun i
bun dev
```

### Development

```bash
bun dev          # API server with --watch on :3000
bun run ui       # LIFF frontend on :5173 (Vite)
bun run build:ui # Build LIFF to public/liff/
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/line/:bot` | LINE webhook receiver |
| PUT | `/flex/:bot/:to` | Push flex message |
| ALL | `/auth/*` | better-auth handler |
| POST | `/auth/liff` | LIFF token auth |
| GET | `/api/line` | List bots |
| GET | `/api/line/:bot/room` | List rooms |
| GET | `/api/line/:bot/history` | Message history |
| POST | `/api/bot` | Register new bot |

### UI Sample

| Notify | Room | Detail |
|--------|------|--------|
| ![notify](./docs/liff-notify.webp) | ![room](./docs/liff-room.webp) | ![detail](./docs/liff-detail.webp) |
