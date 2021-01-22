module.exports = [
  { method: 'GET',  path: '/health', handler: () => ({ OK: true }) },

  { method: 'POST',  path: '/{bot}', handler: require('./line-bot/webhook') },
  { method: 'PUT',  path: '/{bot}/{to?}', handler: require('./route-bot/push-message') },
  { method: 'PUT',  path: '/flex/{name}/{to}', handler: require('./route-bot/push-flex') },
]
