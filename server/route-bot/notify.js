const { nullFormat } = require('numeral')
const debuger = require('@touno-io/debuger')
const { notice } = require('@touno-io/db/schema')
const { pushMessage } = require('../api-notify')

const logger = debuger('API')

module.exports = async (req, res) => {
  const IsWebhook = req.method === 'POST'
  const { room, service } = req.params
  const { message, imageThumbnail, imageFullsize, stickerPackageId, stickerId, notificationDisabled } = req.body
  let outbound = nullFormat

  try {
    await notice.open()
    const { ServiceOauth, LineOutbound } = notice.get()

    if (typeof message !== 'string' && !IsWebhook) { throw new TypeError('Message is undefined.') }

    outbound = await new LineOutbound({
      botname: service,
      userTo: room,
      type: 'notify',
      sender: req.body || {},
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
      sender.message = `*Webhook Payload*\n${process.env.HOST_API}/webhook/${outbound._id}`
    }

    const { headers } = await pushMessage(token.accessToken, sender)

    const result = {
      remaining: parseInt(headers['x-ratelimit-remaining']),
      image: parseInt(headers['x-ratelimit-imageremaining']),
      reset: parseInt(headers['x-ratelimit-reset']) * 1000
    }
    await ServiceOauth.updateOne({ room, service }, { $set: { limit: result } })
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json(result)
  } catch (ex) {
    logger.error(ex)
    if (outbound) { await notice.get('LineOutbound').updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } }) }
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
