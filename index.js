import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { cors } from '@elysiajs/cors'
import { join } from 'path'
import { initDbSchema } from './lib/db.js'
import { auth } from './lib/auth.js'
import routes from './api/route.js'

const app = new Elysia()
  .use(cors({
    origin: ['https://liff.line.me', 'http://localhost:5173'],
    credentials: true,
  }))
  .use(staticPlugin({
    assets: join(import.meta.dirname, 'public', 'liff'),
    prefix: '/liff',
  }))
  .onBeforeHandle(({ set }) => { set.headers['x-developer'] = '@dvgamerr' })
  .all('/auth/*', ({ request }) => auth.handler(request))
  .use(routes)

initDbSchema().then(() => {
  app.listen(parseInt(process.env.PORT || '3000'))
  console.log('elysia listening on :3000')
}).catch(ex => { console.error(ex); process.exit(1) })
