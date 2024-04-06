import register from './notify/register'
import revoke from './notify/revoke'
import message from './notify/message'

import itemView from './notify/itemView'
import itemCreate from './notify/itemCreate'
import itemUpdate from './notify/itemUpdate'

export default [
  { path: '/health', method: 'GET', logLevel: 'error', handler: (_, reply) => reply.send({ ok: '☕' }) },
  
  // LINE Notify
  { path: '/api/notify', method: 'GET', handler: itemView },
  { path: '/api/notify', method: 'POST', handler: itemCreate },
  { path: '/api/notify/:serviceName', method: 'PATCH', handler: itemUpdate },
  // { path: '/api/notify/:notify/room', method: 'GET', handler: require('./db-api/line-notify') },
  // { path: '/api/notify/:notify/history', method: 'GET', handler: require('./db-api/history') },

  // API Notify
  { path: '/register/:serviceName/:roomName?', method: 'GET', handler: register },
  { path: '/revoke/:serviceName/:roomName', method: 'DELETE', handler: revoke },
  { path: '/notify/:serviceName/:roomName', method: ['PUT', 'POST'], handler: message },


  // { method: 'GET', path: '/auth/sso', handler: require('./auth/sso') },
  // { method: 'POST', path: '/auth/login', handler: require('./auth/login') },
  // { method: 'POST', path: '/auth/user', handler: require('./auth/user') },

  // // API Bot
  // {
  //   method: 'PUT',
  //   path: '/system/notice/:msg',
  //   handler: require('./notice')
  // },
  // {
  //   method: 'PUT',
  //   path: '/line/:bot/:to',
  //   handler: require('./line-bot/to')
  // },
  // {
  //   method: 'POST',
  //   path: '/line/:bot',
  //   handler: require('./line-bot/index')
  // },

  // // API UI

  // // LINE Bot
  // { method: 'GET', path: '/api/line', handler: require('./route-db/line-bot') },
  // {
  //   method: 'GET',
  //   path: '/api/line/:bot/room',
  //   handler: require('./route-db/line-bot')
  // },
  // {
  //   method: 'GET',
  //   path: '/api/line/:bot/history',
  //   handler: require('./route-db/history')
  // },



  // {
  //   method: 'GET',
  //   path: '/api/history/:id',
  //   handler: require('./db-api/history')
  // },

  // {
  //   method: 'POST',
  //   path: '/api/notify/check',
  //   handler: require('./db-api/notify/check')
  // },
  // { method: 'POST', path: '/api/bot', handler: require('./db-api/bot/new') },
  // {
  //   method: 'GET',
  //   path: '/api/check/stats',
  //   handler: require('./route-check/stats')
  // },
  // {
  //   method: 'GET',
  //   path: '/api/stats/bot/:name?',
  //   handler: require('./route-check/stats-bot')
  // },
  // {
  //   method: 'GET',
  //   path: '/api/stats/notify/:name?',
  //   handler: require('./route-check/stats-notify')
  // },
  // {
  //   method: 'GET',
  //   path: '/api/stats/slack',
  //   handler: require('./route-check/stats-slack')
  // }

  // API Get Database
  // { method: 'GET', path: '/db/cmd', handler: require('./route-db/bot-cmd') },
  // { method: 'GET', path: '/db/cmd/endpoint', handler: require('./route-db/bot-endpoint') },
  // { method: 'GET', path: '/db/:bot/cmd', handler: require('./route-db/bot-cmd') },
  // { method: 'POST', path: '/db/:bot/cmd/:id', handler: require('./route-db/bot-cmd') },
  // { method: 'GET', path: '/db/:bot/inbound', handler: require('./route-db/history') },
  // { method: 'GET', path: '/db/:bot/outbound', handler: require('./route-db/outbound') },
  // { method: ['GET', 'PATCH', 'PUT'], path: '/line/:bot/{room}/{funcId}', handler: require('./line-bot/function') }

  // { method: 'POST', path: '/line/:bot/:to', handler: require('./webhook/push-webhook') },
  // { method: 'GET', path: '/webhook/:id', handler: require('./webhook') },

  // API Telegram
  // { method: 'PUT', path: '/telegram/:bot/:room', handler: require('./telegram/message') },

  // { method: 'PUT', path: '/flex/:name/:to', handler: require('./route-bot/push-flex') },

  // { method: 'POST', path: '/line/webhook/:type/:name/:to/:msg?', handler: require('./webhook/push-notify') },
]
