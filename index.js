// const md5 = require('md5')
const { Server } = require('@hapi/hapi')
const hapiPlugin = require('@nuxtjs/hapi')
const Sentry = require('@sentry/node')

const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('nuxt')
// const { lineInitilize, cmdExpire } = require('./api/tracking')
const config = require('./nuxt.config.js')

const routes = require('./api')

const server = new Server({ port: config.server.port, host: config.server.host })
const nuxtCreateBuilder = async () => {
  logger.info('MongoDB db-notice connecting...')
  await notice.open()

  logger.start('Server initialize...')
  await server.initialize()
  // await (Promise.all([lineInitilize(), cmdExpire()]))

  await server.register({
    plugin: require('hapi-sentry'),
    options: { client: { dsn: process.env.SENTRY_DSN || false } }
  })
  await server.register({ plugin: hapiPlugin, options: {} })
  server.route(routes)

  const { nuxt, builder } = server.plugins.nuxt

  if (process.env.NODE_ENV !== 'production') {
    await builder.build()
  }

  await nuxt.ready()
  await server.start()
  logger.start(`Server running on ${server.info.uri}`)
}

process.on('unhandledRejection', (ex) => {
  Sentry.captureException(ex)
  logger.error(ex)
  process.exit(1)
})
nuxtCreateBuilder().catch((ex) => {
  Sentry.captureException(ex)
  logger.error(ex)
  process.exit(1)
})
