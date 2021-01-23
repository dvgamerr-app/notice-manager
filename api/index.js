const { notice } = require('@touno-io/db/schema')

module.exports = [
  {
    method: 'GET',
    path: '/health',
    handler: async () => {
      await notice.get('LineBot').countDocuments()
      return { OK: true }
    }
  },

  { method: 'POST',  path: '/{bot}', handler: require('./line-bot/webhook') },
  { method: 'PUT',  path: '/{bot}/{to?}', handler: require('./line-bot/push-message') },
  { method: 'PUT',  path: '/flex/{name}/{to}', handler: require('./route-bot/push-flex') },

  { method: 'POST',  path: '/webhook/{name}/{to}', handler: require('./webhook/push-webhook') },
  { method: 'POST',  path: '/webhook/{type}/{name}/{to}/{msg?}', handler: require('./webhook/push-notify') },
  // { method: 'GET',  path: '/webhook/{id}', handler: require('./webhook') },
]
