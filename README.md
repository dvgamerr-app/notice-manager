# LINE Manager

LIFF dashboard สำหรับจัดการ LINE Messaging API หลายบอตด้วยบัญชี LINE ผู้ดูแลบัญชีเดียว

- เพิ่มหลาย Messaging API channels และเก็บ token ครั้งเดียว
- ตั้งและทดสอบ webhook ของแต่ละบอตผ่าน LINE API
- ค้นพบแชตส่วนตัว กลุ่ม และ multi-person chat จาก signed webhook
- เลือกทั้งการ์ดห้อง แล้วกดส่งข้อความทดสอบได้จาก LIFF
- แสดงชื่อห้องจาก LINE แบบอ่านอย่างเดียว, refresh ชื่อ/รูป และสลับ Join/Leave ได้
- ส่งข้อความ Text, Flex card ขนาดเล็ก หรือ LINE message JSON ไปหลายห้องพร้อมกัน
- Monitor delivery, webhook redelivery และ audit trail พร้อม filter/pagination
- สร้าง API key แยกต่อบอตเพื่อให้ระบบภายนอกส่งเข้า registered chat
- ดู message quota และ rotate credentials จากหน้า dashboard
- ตรวจ `x-line-signature`, กัน webhook ซ้ำด้วย `webhookEventId` และเก็บ delivery log
- ใช้ Bun, Elysia, React, Kysely และรองรับ PostgreSQL/SQLite

## LINE setup

1. สร้าง LINE Login channel และ LIFF app โดย endpoint เป็น
   `https://your-domain.example/liff/` และเปิด scope `openid` กับ `profile`
2. ใช้ LINE account ผู้ดูแล 1 บัญชีเปิด LIFF ครั้งแรก แล้วตั้ง
   `LINE_LOGIN_CHANNEL_ID` และ `VITE_LIFF_ID` จาก LINE Login channel เดียวกัน
3. ตั้ง `CREDENTIAL_ENCRYPTION_KEY` เป็นค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร
4. แนะนำให้ตั้ง `LINE_ADMIN_USER_IDS` เป็น LINE user ID ของผู้ดูแล
   หากเว้นว่าง บัญชี LIFF ที่ยืนยันสำเร็จเป็นบัญชีแรกจะถูกบันทึกเป็น owner ถาวร
   (แม้ตั้ง allowlist ระบบก็ยังผูก installation กับ owner คนแรกเพียงบัญชีเดียว)
5. สำหรับแต่ละบอต ให้สร้าง/เตรียม Messaging API channel แล้วนำ Channel access
   token และ Channel secret มาเพิ่มใน dashboard
6. หากบอตต้องเข้ากลุ่ม ให้เปิด **Allow bot to join group chats**
7. ตั้ง `PUBLIC_BASE_URL` เป็น HTTPS URL สาธารณะก่อนเพิ่มบอต ระบบจะเปลี่ยน
   Webhook URL ของ LINE มาเป็น `/line/:service` ให้อัตโนมัติ ส่วน
   **Sync webhook** ใช้ตั้งค่าซ้ำ และ **Test webhook** ใช้ตรวจการเชื่อมต่อ
8. ส่ง `/hi` ในแชตส่วนตัวหรือกลุ่มเพื่อให้ระบบค้นพบและ register ห้องนั้น

LINE Login/LIFF channel กับ Messaging API channels ที่ต้องการให้ user ID ตรงกัน
ควรอยู่ใต้ provider เดียวกัน แต่ credential และ webhook ยังคงแยกต่อบอต

เอกสารอ้างอิง:

- [Build a LINE bot](https://developers.line.biz/en/docs/messaging-api/building-bot/)
- [Verify webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/)
- [Group and multi-person chats](https://developers.line.biz/en/docs/messaging-api/group-chats/)
- [LIFF getting started](https://developers.line.biz/en/docs/liff/getting-started)
- [Secure LINE access-token verification](https://developers.line.biz/en/docs/line-login/secure-login-process/)

## Run with Bun

```bash
bun install
bun run migrate
bun run build:ui
bun run start
```

Development:

```bash
# terminal 1: Elysia backend with pino-pretty
bun dev

# terminal 2: Vite UI
bun dev:ui
```

`bun dev` เปิด backend แบบ watch ที่ `http://localhost:3000` และแสดง structured
Pino logs ผ่าน `pino-pretty` ส่วน `bun dev:ui` เปิด Vite ที่
`http://127.0.0.1:5173` ให้รันแยก terminal กัน backend จะ proxy `/` และ
`/liff/*` ไป Vite เพื่อใช้ React HMR

เมื่อ development server ทำงาน LIFF UI จะเปิดที่ `http://localhost:3000/`
แต่ LINE Login ไม่อนุญาต
HTTP localhost เป็น LIFF Endpoint/callback ให้ใช้ HTTPS tunnel หรือ LIFF CLI
proxy มายัง local server แล้วตั้ง HTTPS URL นั้นเป็น Endpoint URL ใน LINE
Developers Console; frontend จะให้ LINE ใช้ Endpoint URL นั้นเป็น callback
อัตโนมัติ เมื่อเปิดหน้า LIFF ผ่าน localhost โดยไม่ได้เปิด development auth
bypass ระบบจะแสดงคำเตือนและปุ่มไปยัง tunnel จาก `PUBLIC_BASE_URL` แทนการเริ่ม
LINE Login ส่วน environment อื่นยังใช้ `/liff/` ตามปกติ
LIFF responses ส่ง `Cache-Control: no-transform` เพื่อไม่ให้ tunnel/CDN แทรก
Cloudflare Web Analytics beacon ลงใน HTML ที่ใช้ทดสอบ local

Production ไม่เรียก Vite โดย `bun run build:ui` สร้างไฟล์ไว้ใน `dist/liff`
และ `bun start` เสิร์ฟ build ชุดนั้นที่ `/liff/`

ใช้ SQLite ได้ทันที:

```bash
DATABASE_URL=sqlite://./line-manager.sqlite bun run migrate
DATABASE_URL=sqlite://./line-manager.sqlite bun run dev
```

Production ใช้ PostgreSQL:

```bash
DATABASE_URL=postgresql://user:password@host:5432/line_manager bun run migrate
DATABASE_URL=postgresql://user:password@host:5432/line_manager bun run start
```

`bun run migrate` เป็นคำสั่งเดียวสำหรับทั้ง PostgreSQL และ SQLite และ server
จะเรียก migration ซ้ำอย่างปลอดภัยก่อนเริ่มรับ request ด้วย

## Verification

ตรวจ type safety, automated tests และ production LIFF build ด้วยคำสั่งรวม:

```bash
bun run check
```

ตรวจ runtime development/production แบบไม่ใช้ข้อมูลจริง:

```bash
bun run smoke:dev
bun run smoke:prod
```

ตรวจ migration แยกจากฐานข้อมูลจริงด้วย SQLite in-memory แล้วตรวจ dependency
advisories ก่อนส่งงาน:

```bash
DATABASE_URL=:memory: bun run migrate
bun audit
git diff --check
```

PowerShell ใช้ `$env:DATABASE_URL=':memory:'; bun run migrate` สำหรับ migration
ชุดเดียวกัน ปัจจุบันโปรเจกต์ยังไม่มี lint หรือ format script แยกต่างหาก

## Dashboard

- **Rooms** — filter ห้องส่วนตัว กลุ่ม และ room ข้างจำนวนแชต; เลือกทั้งการ์ด;
  refresh metadata; Join/Leave; เลือกได้สูงสุด 20 ห้องเพื่อส่ง Text หรือ LINE
  Flex card ขนาด micro หรือ message JSON โดย LINE จะ validate payload ก่อน push
- **Monitor** — ดู delivery status, request ID/error, signed webhook event,
  redelivery flag และ audit log แบบ filter และโหลดเพิ่มทีละหน้า
- **API Keys** — สร้าง/revoke bot-scoped key โดย raw key แสดงครั้งเดียว
- **Settings** — sync/test webhook, เปิด/ปิดบอต, message quota และ rotate
  token/secret หลังตรวจว่าเป็น Official Account เดิม

LIFF UI ใช้ shared primitives ใน `src/components/`: `Layout` ดูแล page
shell, `Spinner` ใช้ loading indicator ร่วมกัน และ `Notice`/`ErrorNotice` รวม
รูปแบบ feedback เพื่อไม่ทำ markup และ utility classes ซ้ำในแต่ละหน้า
หน้า LIFF ใช้ navigation และข้อมูลบัญชีจาก LINE host จึงไม่แสดง app header,
ข้อมูลบัญชีผู้ดูแล หรือปุ่มออกจากระบบซ้ำ แต่หน้าเพิ่มและหน้ารายละเอียดบอตยังมี
ปุ่มย้อนกลับในเนื้อหาหน้า

## Main endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/app/config` | อ่าน public tunnel URL สำหรับคำเตือนเมื่อเปิด LIFF ผ่าน localhost |
| `POST` | `/auth/liff` | แลก LIFF access token เป็น local reusable session |
| `POST` | `/auth/logout` | ยกเลิก local session |
| `GET/POST` | `/api/bots` | ดู/เพิ่ม Messaging API bot |
| `PATCH` | `/api/bots/:bot` | แก้ settings หรือ rotate credentials |
| `GET` | `/api/bots/:bot/quota` | อ่าน message quota/usage จาก LINE |
| `POST` | `/api/bots/:bot/webhook/sync` | ตั้ง webhook URL ผ่าน LINE API |
| `POST` | `/api/bots/:bot/webhook/test` | ให้ LINE ทดสอบ webhook endpoint |
| `GET` | `/api/bots/:bot/chats` | ดูแชตที่ค้นพบจาก webhook |
| `PATCH` | `/api/bots/:bot/chats/:chat` | ตั้ง alias/register/active |
| `POST` | `/api/bots/:bot/chats/bulk` | bulk register/unregister |
| `POST` | `/api/bots/:bot/chats/bulk-test` | push ทดสอบหลายห้อง |
| `POST` | `/api/bots/:bot/chats/:chat/refresh` | refresh profile/summary จาก LINE |
| `POST` | `/api/bots/:bot/chats/:chat/leave` | ให้บอตออกจาก group/room |
| `POST` | `/api/bots/:bot/chats/:chat/test` | validate และ push ข้อความทดสอบ |
| `GET` | `/api/bots/:bot/deliveries` | delivery log (`status`, `limit`, `offset`) |
| `GET` | `/api/bots/:bot/webhook-events` | webhook log (`type`, `limit`, `offset`) |
| `GET/POST` | `/api/bots/:bot/api-keys` | ดู/สร้าง external API key |
| `DELETE` | `/api/bots/:bot/api-keys/:key` | revoke external API key |
| `GET` | `/api/bots/:bot/audit-logs` | audit log (`limit`, `offset`) |
| `POST` | `/line/:bot` | รับ LINE webhook |

ทุก `/api/*` endpoint ต้องใช้ session จาก LIFF ส่วน webhook ต้องมี
`x-line-signature` ที่ถูกต้องเสมอ

## External API

ใช้ `X-API-Key` หรือ `Authorization: Bearer <key>` โดย key ใช้ได้เฉพาะบอตที่
สร้าง key และเฉพาะห้องที่ active + registered เท่านั้น ค่าเริ่มต้นจำกัด 60
requests ต่อนาทีต่อ key ปรับได้ด้วย `EXTERNAL_API_RATE_LIMIT`

```bash
curl -X POST \
  'https://your-domain.example/v1/bots/my-bot/chats/CHAT_ID/messages' \
  -H 'X-API-Key: lm_live_REPLACE_ME' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hello from API","notificationDisabled":false}'
```

`CHAT_ID` ใช้ managed chat ID หรือ LINE source ID ได้ และ payload ขั้นสูงใช้
`{"messages":[...LINE message objects...]}` ได้สูงสุด 5 messages ตามข้อกำหนด LINE
