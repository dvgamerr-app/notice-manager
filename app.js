import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { Elysia } from 'elysia'
import routes from './api/route.js'
import { logger } from './lib/logger.js'

const configuredOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const viteDevServerUrl = () =>
  (process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '')
const productionLiffDirectory = join(import.meta.dirname, 'dist', 'liff')
const noTransformHeaders = { 'Cache-Control': 'no-transform' }

const proxyToVite = async ({ request }) => {
  const source = new URL(request.url)
  const pathname = source.pathname === '/' || source.pathname === '/liff'
    ? '/liff/'
    : source.pathname
  const target = `${viteDevServerUrl()}${pathname}${source.search}`
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    })
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Cache-Control', 'no-store, no-transform')
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch {
    return new Response('Vite development server is unavailable', {
      status: 502,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
}

const redirectToProductionLiff = ({ request }) => {
  const { search } = new URL(request.url)
  return Response.redirect(`/liff/${search}`)
}

export const createApp = () => {
  const app = new Elysia()
    .use(cors({
      origin: configuredOrigins,
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type', 'X-API-Key', 'X-Dev-User'],
    }))

  if (process.env.NODE_ENV === 'development') {
    app
      .all('/', proxyToVite)
      .all('/liff', proxyToVite)
      .all('/liff/*', proxyToVite)
  } else {
    if (existsSync(productionLiffDirectory)) {
      app.use(staticPlugin({
        assets: productionLiffDirectory,
        prefix: '/liff',
        headers: noTransformHeaders,
      }))
    } else {
      const missingBuild = () => new Response(
        'Production LIFF build is missing. Run bun run build:ui.',
        { status: 503, headers: noTransformHeaders },
      )
      app.get('/liff', missingBuild).get('/liff/*', missingBuild)
    }
    app.get('/', redirectToProductionLiff)
  }

  return app
    .onBeforeHandle(({ set }) => {
      set.headers['x-content-type-options'] = 'nosniff'
      set.headers['referrer-policy'] = 'same-origin'
      set.headers['x-frame-options'] = 'SAMEORIGIN'
    })
    .use(routes)
    .onError(({ error, set }) => {
      const errorRecord = error && typeof error === 'object' ? error : {}
      const errorStatus = Number('status' in errorRecord ? errorRecord.status : 0)
      const responseStatus = Number(set.status)
      const status = errorStatus >= 400
        ? errorStatus
        : responseStatus >= 400
          ? responseStatus
          : 500

      if (status >= 500) logger.error({ err: error, status }, 'Unhandled request error')
      set.status = status
      const message = 'message' in errorRecord ? String(errorRecord.message) : 'Request failed'
      return { error: status >= 500 ? 'Internal server error' : message }
    })
}
