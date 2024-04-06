import fastify from 'fastify'
import pino from 'pino'
import { initDbSchema } from './lib/db-conn'
import routeApi from './api/route'

const app = fastify({ console: false, logger: true })
const logger = pino()

app.addHook('onRequest', (req, reply, done) => {
  reply.header('x-developer', '@dvgamerr')
  done()
})

const initialize = () => Promise.all([
  initDbSchema(),
  (() => {
    // append router path
    for (const api of routeApi) {
      app.route(api)
    }
  })()
])

initialize().then(async () => {
  logger.info('fastify listen:3000')
  return app.listen({ port: 3000, host: '0.0.0.0' })
}).catch((ex) => {
  logger.error(ex)
})
