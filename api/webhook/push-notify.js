const Boom = require('@hapi/boom')
const { notice } = require('@touno-io/db/schema')
const sdkClient = require('../sdk-client')
const sdkNotify = require('../sdk-notify')

module.exports = async (req) => {
  try {
    const { type, name: botname, to: userTo, msg } = req.params
    const sender = req.payload || {}

    const { LineOutbound } = notice.get()

    const { pushNotify } = await sdkNotify(botname, userTo)

    const outbound = await new LineOutbound({ botname, userTo, type, sender, sended: false }).save()
    if (sender.app && sender.git_log) {
      await pushNotify(` ... *${sender.app} ${sender.release}*\n${sender.git_log}`)
    } else if (type === 'notify') {
      pushNotify(msg || sender)
    } else if (type === 'bot') {
      const { pushMessage } = await sdkClient(botname)
      pushMessage(userTo, msg || sender)
    }
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
  } catch (ex) {
    throw Boom.internal(ex.message, ex)
  }

  return { OK: true }
}
