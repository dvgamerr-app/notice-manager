const os = require('os')

const fastify = require('fastify')({ logger: false })
const Sentry = require('@sentry/node')
const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')
const { monitorLINE } = require('./api/monitor')

const apiRoute = require('./api')
const pkg = require('./package.json')

const production = process.env.NODE_ENV === 'production'
const infoInit = {
  serverName: os.hostname(),
  environment: process.env.NODE_ENV || 'development',
  release: pkg.name || 'notice',
  debug: !production,
  dsn: production ? process.env.SENTRY_DSN : null,
  tracesSampleRate: 1.0
}
logger.info('Sentry:', JSON.stringify(infoInit))
Sentry.init(infoInit)

fastify.setErrorHandler(function (ex, req, reply) {
  logger.error(ex)
  Sentry.captureException(ex)
  reply.status(500).send(ex)
})

fastify.register(require('@fastify/cors'), {})
fastify.register((fastify, options, done) => {
  // fastify.addHook('onRequest', (req, reply, done) => {
  //   req.userId = req.headers['x-userId']
  //   // eslint-disable-next-line no-console
  //   console.log('userId:', req.userId)
  //   reply.header('x-developer', '@dvgamerr')
  //   done()
  // })

  fastify.get('/health', (req, reply) => reply.code(200).send('☕'))
  done()
})

for (const api of apiRoute) {
  fastify.route(api)
}

const initialize = async () => {
  await notice.open()
}

const exitHandler = (err, exitCode) => {
  notice.close()
  logger.error(`${exitCode}:Exiting... (${err})`)
  process.exit(0)
}

process.on('SIGINT', exitHandler)
process.on('SIGTERM', exitHandler)
process.on('SIGUSR1', exitHandler)
process.on('SIGUSR2', exitHandler)
process.on('uncaughtException', exitHandler)

initialize().then(async () => {
  await fastify.listen({ port: 3001, host: '0.0.0.0' })
  logger.info('fastify listen:3001')
  if (production) { await monitorLINE(`*[Started]* \`${os.hostname()}\` is running Notice-LINE.`) }
}).catch((ex) => {
  Sentry.captureException(ex)
  fastify.log.error(ex)
  logger.error(ex)
  process.exit(1)
})
