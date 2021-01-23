const { Server } = require('@hapi/hapi')
const { notice } = require('@touno-io/db/schema')

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 4000
const routes = require('../api')

exports.create = async () => {
  const app = new Server({ port, host })

  app.route(routes)
  return app
}

exports.prepare = async () => {
  await notice.open()
  const { LineBot } = notice.get()
  await (new LineBot({
    botname: 'e-ngo',
    name: 'E-Ngo',
    accesstoken: process.env.BOT_ACCESSTOKEN,
    secret: process.env.BOT_SECRET,
    active: true
  })).save()
}

exports.remove = async () => {
  const { LineBot } = notice.get()
  await LineBot.deleteMany()
}
