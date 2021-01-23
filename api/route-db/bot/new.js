const { notice } = require('@touno-io/db/schema')
const { loggingLINE } = require('../../logging')

module.exports = async (req) => {
  const data = req.body
  const { LineBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth

  if (await LineBot.findOne({ botname: data.name, active: true })) { throw new Error('name is duplicate.') }
  const found = await LineBot.findOne({ botname: data.name })
  if (!found) {
    await new LineBot({
      type: 'line',
      id: data.id,
      name: data.name,
      botname: data.name,
      accesstoken: data.client_id,
      secret: data.client_secret,
      options: { stats: { usage: 0, limited: 0, reply: 0, push: 0, updated: new Date() } }
    }).save()
  } else {
    await LineBot.updateOne({ name: data.name, active: false }, {
      $set: {
        id: data.id,
        accesstoken: data.client_id,
        secret: data.client_secret,
        active: true
      }
    })
  }
  await loggingLINE(`Notify Bot add *${data.name}*`)
  return {}
}
