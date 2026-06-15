import fastify from 'fastify'
import staticPlugin from '@fastify/static'
import pino from 'pino'
import { join } from 'path'
import { initDbSchema } from './lib/db.js'
import routes from './api/route.js'

const app = fastify({ logger: false })
const logger = pino()

// Preserve raw body for LINE signature verification
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, payload, done) => {
  req.rawBody = payload.toString()
  try { done(null, JSON.parse(payload)) }
  catch (ex) { done(ex) }
})

app.addHook('onRequest', (req, reply, done) => {
  reply.header('x-developer', '@dvgamerr')
  done()
})

// Serve LIFF SPA from public/liff/
app.register(staticPlugin, {
  root: join(import.meta.dirname, 'public', 'liff'),
  prefix: '/liff/',
  decorateReply: false
})

for (const route of routes) app.route(route)

initDbSchema().then(async () => {
  await app.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' })
  logger.info('fastify listening on :3000')
}).catch((ex) => {
  logger.error(ex)
  process.exit(1)
})
