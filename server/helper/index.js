const debuger = require('@touno-io/debuger')
const mongo = require('../line-bot')
const pkg = require('../../package.json')
const { pushMessage } = require('../api-notify')

const logger = debuger(pkg.title)
const pkgName = `LINE-BOT v${pkg.version}`
module.exports = {
  pkgChannel: 'heroku-notify',
  pkgName,
  notifyLogs: async (ex) => {
    const { ServiceOauth } = mongo.get()
    const logs = await ServiceOauth.findOne({ service: 'log', room: 'slog' })
    if (ex instanceof Error) {
      ex = ex.message ? `*${(ex.message || '').substring(0, 200)}*\n${(ex.stack || '').substring(0, 200)}` : ex
    }
    if (!logs || !logs.accessToken) { return logger.log(ex) }
    await pushMessage(logs.accessToken, `*${pkgName}* ... ${ex}`)
  },
  sendNotify: async (service, room, message) => {
    if (!service || !room) { return logger.log('No service, No room.') }

    const { ServiceOauth } = mongo.get()
    const oauth = await ServiceOauth.findOne({ service, room })
    if (!oauth || !oauth.accessToken) { return logger.log(`Oauth: ${service} in ${room}, No access token.`) }
    await pushMessage(oauth.accessToken, message)
  },
  webhookLogger: async (req, res, callback, botname = 'webhook', userTo = 'user') => {
    let outbound = null
    const { LineOutbound } = mongo.get()

    try {
      outbound = await new LineOutbound({
        botname,
        userTo,
        type: 'notify',
        sender: req.body || {},
        sended: false,
        error: null,
        created: new Date()
      }).save()

      await callback(req, res)
      await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
      res.json({})
    } catch (ex) {
      if (outbound) { await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } }) }
      res.status(ex.error ? ex.error.status : 500)
      res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
    } finally {
      res.end()
    }
  }
  // webhookMessage: async (type, botname, body) => {
  //   await mongo.open()
  //   const { ChatWebhook } = mongo.get()
  //   const chat = await ChatWebhook.findOne({ type, botname })
  //   await request.post(chat.uri, { body, json: true })
  // }
}
