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
  { method: 'GET', path: '/auth/sso', handler: require('./auth/sso') },
  { method: 'POST', path: '/auth/login', handler: require('./auth/login') },
  { method: 'POST', path: '/auth/user', handler: require('./auth/user') },

  { method: 'POST', path: '/{bot}', handler: require('./line-bot/webhook') },
  { method: 'PUT', path: '/{bot}/{to?}', handler: require('./line-bot/push-message') },
  { method: 'PUT', path: '/flex/{name}/{to}', handler: require('./route-bot/push-flex') },

  { method: 'POST', path: '/webhook/{name}/{to}', handler: require('./webhook/push-webhook') },
  { method: 'POST', path: '/webhook/{type}/{name}/{to}/{msg?}', handler: require('./webhook/push-notify') },
  { method: 'GET', path: '/webhook/{id}', handler: require('./webhook') },

  // API UI
  { method: 'GET', path: '/api/service/dashboard', handler: require('./route-db/service/dashboard') },
  { method: 'POST', path: '/api/service/check', handler: require('./route-db/service/check') },
  { method: 'POST', path: '/api/service/update', handler: require('./route-db/service/update') },
  { method: 'POST', path: '/api/service', handler: require('./route-db/service/new') },
  { method: 'POST', path: '/api/bot', handler: require('./route-db/bot/new') },
  { method: 'GET', path: '/api/check/stats', handler: require('./route-check/stats') },
  { method: 'GET', path: '/api/stats/bot/{id}', handler: require('./route-check/stats-bot') },
  { method: 'GET', path: '/api/stats/slack', handler: require('./route-check/stats-slack') },

  // API Get Database
  { method: 'GET', path: '/db/cmd', handler: require('./route-db/bot-cmd') },
  { method: 'GET', path: '/db/cmd/endpoint', handler: require('./route-db/bot-endpoint') },
  { method: 'GET', path: '/db/{bot}/cmd', handler: require('./route-db/bot-cmd') },
  { method: 'POST', path: '/db/{bot}/cmd/{id}', handler: require('./route-db/bot-cmd') },
  { method: 'GET', path: '/db/{bot}/inbound', handler: require('./route-db/inbound') },
  { method: 'GET', path: '/db/{bot}/outbound', handler: require('./route-db/outbound') },

  // API Notify
  { method: 'GET', path: '/register/{service}/{room?}', handler: require('./route-bot/oauth') },
  { method: ['PUT', 'POST'], path: '/notify/{service}/{room}', handler: require('./route-bot/notify') },
  { method: 'PUT', path: '/revoke/{service}/{room}', handler: require('./route-bot/revoke') }
]
