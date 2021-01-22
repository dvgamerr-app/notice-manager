// const md5 = require('md5')
const { Server } = require('@hapi/hapi')
// const hapiPlugin = require('@nuxtjs/hapi')
const Sentry = require('@sentry/node')

const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('nuxt')

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 4000

const routes = require('./api')

const NuxtBuilder = async () => {
  logger.info('MongoDB db-notice connecting...')
  await notice.open()

  const server = new Server({ port, host })
  await server.register({
    plugin: require('hapi-sentry'),
    options: { client: { dsn: process.env.SENTRY_DSN || false } }
  })
  // await server.register({ plugin: hapiPlugin, options: {} })
  server.route(routes)

  // const { nuxt, builder } = server.plugins.nuxt

  // await builder.build()
  // await nuxt.ready()
  await server.start()
  logger.start(`Server running on ${server.info.uri}`)
}

process.on('unhandledRejection', (err) => {
  Sentry.captureException(ex)
  logger.error(err)
  process.exit(1)
})

NuxtBuilder().catch(ex => {
  Sentry.captureException(ex)
  logger.error(ex)
  process.exit(1)
})
