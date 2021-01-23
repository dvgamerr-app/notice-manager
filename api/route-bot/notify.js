const { nullFormat } = require('numeral')
const { notice } = require('@touno-io/db/schema')
const { pushMessage } = require('../sdk-notify')

module.exports = async (req, res) => {
  const IsWebhook = req.method === 'POST'
  const { room, service } = req.params
  const { message, imageThumbnail, imageFullsize, stickerPackageId, stickerId, notificationDisabled } = req.payload
  let outbound = nullFormat

  await notice.open()
  const { ServiceOauth, LineOutbound, ServiceWebhook } = notice.get()

  if (typeof message !== 'string' && !IsWebhook) { throw new TypeError('Message is undefined.') }

  outbound = await new LineOutbound({
    botname: service,
    userTo: room,
    type: 'notify',
    sender: req.payload || {},
    sended: false,
    error: null,
    created: new Date()
  }).save()

  const token = await ServiceOauth.findOne({ service, room })
  if (!token || !token.accessToken) { throw new Error('Service and room not register.') }

  const sender = {}
  if (!IsWebhook) {
    sender.message = message.replace(/\\n|newline/ig, '\n')

    if (imageThumbnail !== undefined) { sender.imageThumbnail = imageThumbnail }
    if (imageFullsize !== undefined) { sender.imageFullsize = imageFullsize }
    if (stickerPackageId !== undefined) { sender.stickerPackageId = stickerPackageId }
    if (stickerId !== undefined) { sender.stickerId = stickerId }
    if (notificationDisabled !== undefined) { sender.notificationDisabled = notificationDisabled }
  } else {
    const payload = await ServiceWebhook.findOne({ service, room })
    if (payload) {
      try {
        // eslint-disable-next-line no-unused-vars
        const { body } = req
        // eslint-disable-next-line no-eval
        sender.message = eval('`' + payload.body + '`')
      } catch (ex) {
        sender.message = `eval \`fail\`\n${process.env.HOST_API}/webhook/${outbound._id}`
      }
    } else {
      sender.message = `*Webhook Payload*\n${process.env.HOST_API}/webhook/${outbound._id}`
    }
  }

  const { headers } = await pushMessage(token.accessToken, sender)

  const result = {
    remaining: parseInt(headers['x-ratelimit-remaining']),
    image: parseInt(headers['x-ratelimit-imageremaining']),
    reset: parseInt(headers['x-ratelimit-reset']) * 1000
  }
  await ServiceOauth.updateOne({ room, service }, { $set: { limit: result } })
  await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
  return result
}
