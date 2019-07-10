# LINE-BOT and LINE Notify Web GUI
สร้าง http router สำหรับใช้ noti ข้อมูล

### Supported
- LINE BOT
- LINE Notify
- Slack

### Installation
```bash
git clone https://github.com/touno-io/line-notify.git notify-notify
cd notify-notify
npm i
npm run dev
# open browser http://localhost:4000
```

### Deploy to Heroku
```env
TZ=Asia/Bangkok
SLACK_TOKEN=xoxb-.....
MONGODB_URI=
HOST_API=
```

`SLACK_TOKEN` Not set, the system will not send messages via slack.

`HOST_API` require domain name and api. example 'https://notify.domain.com'

```bash
heroku login
git push heroku
```
