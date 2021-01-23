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

  { method: 'GET', path: '/api/service/dashboard', handler: require('./route-db/service/dashboard') }
]

// app.post('/api/service/check', require('../api/route-db/service/check'))
// app.post('/api/service/update', require('../api/route-db/service/update'))
// app.post('/api/service', require('../api/route-db/service/new'))
// app.post('/api/bot', require('../api/route-db/bot/new'))
// app.get('/api/check/stats', require('../api/route-check/stats'))
// app.get('/api/stats/bot/:id', require('../api/route-check/stats-bot'))
// app.get('/api/stats/slack', require('../api/route-check/stats-slack'))
