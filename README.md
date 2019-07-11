# LINE-BOT and LINE Notify Web GUI
สร้าง http router สำหรับใช้ noti ข้อมูล

### Supported
- LINE BOT
- LINE Notify
- Slack

#### Dashboard
![Dashboard](https://raw.githubusercontent.com/touno-io/line-notify/master/docs/dashboard.png)
![Documentation]https://raw.githubusercontent.com/touno-io/line-notify/master/docs/documentation.png)

### Installation
```bash
git clone https://github.com/touno-io/line-notify.git line-notify
cd line-notify
npm i
npm run dev
# open browser http://localhost:4000
```

### Deploy to Heroku
```bash
heroku login
git push heroku
```

#### Environment

- `HOST_API` require domain name and api. example 'https://notify.domain.com'

```env
TZ=Asia/Bangkok
HOST_API=
MONGODB_URI=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```
