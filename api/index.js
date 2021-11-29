module.exports = [
  // { method: 'GET', path: '/auth/sso', handler: require('./auth/sso') },
  // { method: 'POST', path: '/auth/login', handler: require('./auth/login') },
  // { method: 'POST', path: '/auth/user', handler: require('./auth/user') },

  // API Bot
  { method: 'PUT', path: '/line/:bot/:to', handler: require('./line-bot/message') },
  { method: 'POST', path: '/line/:bot', handler: require('./line-bot/webhook') },

  // API Notify
  { method: 'GET', path: '/register/:service/:room?', handler: require('./route-bot/oauth') },
  { method: 'PUT', path: '/revoke/:service/:room', handler: require('./route-bot/revoke') },
  { method: ['PUT', 'POST'], path: '/notify/:service/:room', handler: require('./route-bot/notify') },

  // API UI
  { method: 'GET', path: '/api/line', handler: require('./route-db/line-bot') },
  { method: 'GET', path: '/api/line/:bot/room', handler: require('./route-db/line-bot') },
  { method: 'GET', path: '/api/line/:bot/history', handler: require('./route-db/history') },

  { method: 'GET', path: '/api/notify', handler: require('./route-db/line-notify') },
  { method: 'GET', path: '/api/notify/:notify/room', handler: require('./route-db/line-notify') },
  { method: 'GET', path: '/api/notify/:notify/history', handler: require('./route-db/history') },

  { method: 'GET', path: '/api/history/:id', handler: require('./route-db/history') },

  // { method: 'GET', path: '/api/service/dashboard', handler: require('./route-db/service/dashboard') },
  { method: 'POST', path: '/api/service/check', handler: require('./route-db/service/check') },
  { method: 'POST', path: '/api/service/update', handler: require('./route-db/service/update') },
  { method: 'POST', path: '/api/service', handler: require('./route-db/service/new') },
  { method: 'POST', path: '/api/bot', handler: require('./route-db/bot/new') },
  { method: 'GET', path: '/api/check/stats', handler: require('./route-check/stats') },
  { method: 'GET', path: '/api/stats/bot/:name?', handler: require('./route-check/stats-bot') },
  { method: 'GET', path: '/api/stats/notify/:name?', handler: require('./route-check/stats-notify') },
  { method: 'GET', path: '/api/stats/slack', handler: require('./route-check/stats-slack') },

  // API Get Database
  { method: 'GET', path: '/db/cmd', handler: require('./route-db/bot-cmd') },
  { method: 'GET', path: '/db/cmd/endpoint', handler: require('./route-db/bot-endpoint') },
  { method: 'GET', path: '/db/:bot/cmd', handler: require('./route-db/bot-cmd') },
  { method: 'POST', path: '/db/:bot/cmd/:id', handler: require('./route-db/bot-cmd') },
  { method: 'GET', path: '/db/:bot/inbound', handler: require('./route-db/history') },
  { method: 'GET', path: '/db/:bot/outbound', handler: require('./route-db/outbound') },

  { method: ['GET', 'PATCH', 'PUT'], path: '/line/:bot/{room}/{funcId}', handler: require('./line-bot/function') }

  // { method: 'POST', path: '/line/:bot/:to', handler: require('./webhook/push-webhook') },
  // { method: 'GET', path: '/webhook/:id', handler: require('./webhook') },

  // API Telegram
  // { method: 'PUT', path: '/telegram/:bot/:room', handler: require('./telegram/message') },

  // { method: 'PUT', path: '/flex/:name/:to', handler: require('./route-bot/push-flex') },

  // { method: 'POST', path: '/line/webhook/:type/:name/:to/:msg?', handler: require('./webhook/push-notify') },
]
