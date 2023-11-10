const axios = require('axios')
// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req) => {
  const { name, to: userTo } = req.params
  const sender = req.body
  if (!sender) {
    throw new Error('Not Support payload.')
  }

  const { LineOutbound, ChatWebhook } = notice.get()
  const chat = await ChatWebhook.findOne({ botname: name })
  if (!chat) {
    throw new Error('Not Support webhook request.')
  }

  const outbound = await new LineOutbound({
    type: 'webhook',
    userTo,
    sender,
    sended: false
  }).save()
  try {
    await axios(chat.uri, { body: sender, json: true })
    await LineOutbound.updateOne(
      { _id: outbound._id },
      { $set: { sended: true } }
    )
  } catch (ex) {
    req.log('error', ex)
    await LineOutbound.updateOne(
      { _id: outbound._id },
      { $set: { error: ex.message || ex.toString() } }
    )
    throw ex
  }
}
