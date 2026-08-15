import { join } from 'node:path'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { Elysia } from 'elysia'
import routes from './api/route.js'

const configuredOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const liffIndex = join(import.meta.dirname, 'public', 'liff', 'index.html')

const serveLiffEntry = ({ request }) => {
  if (process.env.NODE_ENV === 'development') return Bun.file(liffIndex)

  const { search } = new URL(request.url)
  return Response.redirect(`/liff/${search}`)
}

export const createApp = () =>
  new Elysia()
    .use(cors({
      origin: configuredOrigins,
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type', 'X-API-Key', 'X-Dev-User'],
    }))
    .use(staticPlugin({
      assets: join(import.meta.dirname, 'public', 'liff'),
      prefix: '/liff',
    }))
    .onBeforeHandle(({ set }) => {
      set.headers['x-content-type-options'] = 'nosniff'
      set.headers['referrer-policy'] = 'same-origin'
      set.headers['x-frame-options'] = 'SAMEORIGIN'
    })
    .get('/', serveLiffEntry)
    .use(routes)
    .onError(({ error, set }) => {
      const errorStatus = Number(error?.status)
      const responseStatus = Number(set.status)
      const status = errorStatus >= 400
        ? errorStatus
        : responseStatus >= 400
          ? responseStatus
          : 500

      if (status >= 500) console.error(error)
      set.status = status
      return { error: status >= 500 ? 'Internal server error' : error.message }
    })
