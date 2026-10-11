<div align="center">

# LINE Manager

**API ครอบ LINE ที่ self-host ได้ จัดการทุกบอตของคุณจาก LINE account เดียว**

ส่งข้อความ รับ webhook และ forward ไปที่ไหนก็ได้ ผ่าน REST API เส้นเดียว<br>
ไม่ต้องจ่ายค่า SaaS ไม่มีค่าธรรมเนียมต่อข้อความ และข้อมูลไม่ออกจากเซิร์ฟเวอร์ของคุณ

[![Stars](https://img.shields.io/github/stars/dvgamerr-app/notice-manager?style=for-the-badge&logo=github&color=06C755)](https://github.com/dvgamerr-app/notice-manager/stargazers)
[![Release](https://img.shields.io/github/v/release/dvgamerr-app/notice-manager?style=for-the-badge&color=06C755)](https://github.com/dvgamerr-app/notice-manager/releases)
[![License](https://img.shields.io/github/license/dvgamerr-app/notice-manager?style=for-the-badge)](LICENSE)

[เว็บไซต์](https://dvgamerr-app.github.io/notice-manager/) · [เริ่มใช้งานเร็ว](#-deploy-ใน-5-นาที) · [คู่มือ self-host](docs/self-hosting.md) · [English](README.md)

<br>

<img src="docs/screenshots/rooms.png" width="230" alt="Rooms">
<img src="docs/screenshots/composer.png" width="230" alt="Flex composer">
<img src="docs/screenshots/monitor.png" width="230" alt="Monitor">

<br>

**ถ้าโปรเจกต์นี้ช่วยประหยัดเวลาคุณได้ รบกวน [⭐ กด Star ให้หน่อยนะ](https://github.com/dvgamerr-app/notice-manager) เป็นวิธีที่ดีที่สุดที่จะช่วยให้นักพัฒนา LINE คนอื่นเจอโปรเจกต์นี้**

</div>

---

## ทำไมต้อง LINE Manager

LINE Messaging API ทรงพลัง แต่พอมีหลายบอตก็ต้องดูแล token, webhook URL, ID ของ user/group/room
และการตรวจ signature หลายชุด LINE Manager เป็นชั้นที่ self-host เองครอบไว้ให้:

- **LINE account เดียว หลายบอต** login ด้วย LIFF ครั้งเดียว แล้วจัดการทุก Messaging API channel จากมือถือ
- **API เส้นเดียว** สคริปต์ CI cron และเซิร์ฟเวอร์ของคุณเรียก `POST /v1/bots/:bot/chats/:chat/messages` ด้วย API key โดยไม่ต้องแตะ LINE token
- **Self-host เต็มรูปแบบ** token ถูกเข้ารหัส AES-256-GCM ในฐานข้อมูลของคุณเอง ไม่ส่งให้บุคคลที่สาม
- **Deploy ได้ด้วยคำสั่งเดียว** มี image สำเร็จรูป (amd64/arm64) ใช้ SQLite เป็นค่าเริ่มต้น และตั้งค่าแค่ 3 ตัว ไม่ต้อง build เอง

## ความสามารถ

| | |
|---|---|
| 🤖 **จัดการหลายบอต** | เพิ่ม Messaging API bot ได้หลายตัว ระบบตั้งและตรวจ webhook กับ LINE ให้อัตโนมัติ |
| 💬 **ค้นพบห้องอัตโนมัติ** | แชตส่วนตัว กลุ่ม และ multi-person chat โผล่จาก signed webhook พิมพ์ `/hi` เพื่อลงทะเบียนห้อง `/id` เพื่อดู ID |
| 📨 **ส่ง Text และ Flex** | เขียนข้อความพร้อมพรีวิวแบบ LINE ตั้งชื่อและรูปผู้ส่งได้ แล้วส่งไปได้สูงสุด 20 ห้องพร้อมกัน LINE ตรวจ payload ก่อน push ทุกครั้ง |
| 🔑 **API key แยกต่อบอต** | key `lm_live_...` เก็บแบบ hash และแสดงครั้งเดียว แต่ละ key เข้าถึงได้เฉพาะห้องที่ลงทะเบียนของบอตตัวเอง |
| 🚦 **Rate limit แบบกระจาย** | ตัวนับ atomic ในฐานข้อมูลใช้ร่วมกันทุก instance และตอบ header `RateLimit-*` มาตรฐาน |
| 🔀 **Webhook forwarding** | ส่งต่อ event จาก LINE ไปยัง HTTPS endpoint ของคุณ แต่ละปลายทางมี secret สำหรับเซ็นเอง retry แบบ backoff, circuit breaker และประวัติการส่ง |
| 🔍 **Monitor และ audit** | ค้นหา delivery, webhook event และ audit log พร้อมชื่อห้องที่อ่านง่าย |
| 🛡️ **ปลอดภัยตั้งแต่ค่าเริ่มต้น** | ตรวจ HMAC signature, กัน event ซ้ำ, ป้องกัน SSRF ตอน forward, เข้ารหัส credential และใช้นโยบาย owner คนเดียว |
| 🗄️ **SQLite หรือ PostgreSQL** | เริ่มต้นได้ทันทีด้วย SQLite แล้วย้ายไป PostgreSQL เมื่อต้องการ ใช้ migration ชุดเดียวกัน |

<details>
<summary><b>Screenshot เพิ่มเติม</b></summary>
<br>
<p align="center">
  <img src="docs/screenshots/bots.png" width="190" alt="Bots">
  <img src="docs/screenshots/api-keys.png" width="190" alt="API keys">
  <img src="docs/screenshots/forwards.png" width="190" alt="Webhook forwarding">
  <img src="docs/screenshots/settings.png" width="190" alt="Settings">
</p>
</details>

## 🚀 Deploy ใน 5 นาที

ต้องมีเซิร์ฟเวอร์หรือ VPS ที่ติดตั้ง Docker และมี HTTPS URL สาธารณะ (LINE บังคับ) ขั้นตอนด้านล่างใช้ Caddy กับ Let's Encrypt สร้าง HTTPS ให้เอง

**1. เตรียมฝั่ง LINE** (ทำครั้งเดียว)

1. ใน [LINE Developers Console](https://developers.line.biz/console/) สร้าง channel แบบ **LINE Login**
2. เพิ่ม **LIFF app** โดยตั้ง **Endpoint URL** เป็น `https://YOUR_DOMAIN/liff/` และเปิด scope `openid` กับ `profile`
3. คัดลอก **LIFF ID** หน้าตาประมาณ `1234567890-AbCdEfGh`

**2. สั่งรัน**

```bash
curl -O https://raw.githubusercontent.com/dvgamerr-app/notice-manager/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/dvgamerr-app/notice-manager/main/.env.example

# แก้ .env: LIFF_ID, PUBLIC_BASE_URL, DOMAIN และ CREDENTIAL_ENCRYPTION_KEY (openssl rand -hex 32)
docker compose --profile https up -d
```

เท่านี้เลย เปิด `https://YOUR_DOMAIN/liff/` ใน LINE, login แล้วกด **Add bot**
ชุดนี้มี HTTPS reverse proxy และ SQLite volume ที่เก็บข้อมูลถาวรให้แล้ว ถ้าใช้ proxy หรือ tunnel ของตัวเอง
ให้ตัด `--profile https` ออกแล้วชี้ไปที่พอร์ต `3000` ส่วน PostgreSQL, backup และการอัปเกรดดู[คู่มือ self-host](docs/self-hosting.md)

**3. เพิ่มบอตตัวแรก**

ใน dashboard เลือก **Add bot** แล้ววาง *Channel access token* และ *Channel secret* ของบอต
LINE Manager จะตรวจ token ตั้ง webhook เป็น `https://YOUR_DOMAIN/line/<bot>` และเริ่มค้นหาห้องให้
ส่ง `/hi` หาบอตในแชตใดก็ได้เพื่อลงทะเบียนห้องนั้น

## ส่งข้อความจากที่ไหนก็ได้

สร้าง API key ใน dashboard (**API Keys**) แล้วเรียกจากภาษาอะไรก็ได้:

```bash
curl -X POST 'https://YOUR_DOMAIN/v1/bots/my-bot/chats/CHAT_ID/messages' \
  -H 'X-API-Key: lm_live_REPLACE_ME' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Deploy เสร็จแล้ว ✅"}'
```

ส่งการ์ดสวยๆ ได้ด้วย `{"messages":[ ...LINE message objects... ]}` (สูงสุด 5 ข้อความ)
ค่าเริ่มต้นจำกัด 60 requests ต่อนาทีต่อ key ปรับได้ด้วย `EXTERNAL_API_RATE_LIMIT`

## เอกสาร

- [คู่มือ self-host](docs/self-hosting.md) (English): ตั้งค่า LINE, environment variables, PostgreSQL, ทางเลือก HTTPS, อัปเกรด, backup
- [Reference ภาษาไทย](docs/reference.th.md): routes, พฤติกรรม dashboard, retention และ CI/CD
- [บันทึกสถาปัตยกรรม](CLAUDE.md)

## สนับสนุนโปรเจกต์

LINE Manager ใช้ฟรีภายใต้สัญญาอนุญาต MIT ถ้ามีประโยชน์กับคุณ:

- ⭐ **[กด Star](https://github.com/dvgamerr-app/notice-manager)** ให้คนอื่นเจอโปรเจกต์นี้
- 🐛 [เปิด issue](https://github.com/dvgamerr-app/notice-manager/issues) แจ้งบั๊กหรือเสนอไอเดีย
- ☕ [สนับสนุนผู้พัฒนา](https://sponsor.dvgamerr.app)
