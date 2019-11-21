import debuger from '@touno-io/debuger'
import { pushMessage } from '../api-notify'
import mongo from '../mongodb'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { message, imageThumbnail, imageFullsize, stickerPackageId, stickerId, notificationDisabled } = req.body
  let outbound = null
  
  await mongo.open()
  const { ServiceOauth, LineOutbound } = mongo.get()

  try {
    if (typeof message !== 'string') throw new Error('Message is undefined.')

    outbound = await new LineOutbound({
      botname: service,
      userTo: room,
      type: 'notify',
      sender: req.body || {},
      sended: false,
      error: null,
      created: new Date(),
    }).save()

    const token = await ServiceOauth.findOne({ service, room })
    if (!token || !token.accessToken) throw new Error('Service and room not register.')

    let sender = {
      message: message.replace(/\\n|newline/ig, '\n')
    }
    if (imageThumbnail != undefined) sender.imageThumbnail = imageThumbnail
    if (imageFullsize != undefined) sender.imageFullsize = imageFullsize
    if (stickerPackageId != undefined) sender.stickerPackageId = stickerPackageId
    if (stickerId != undefined) sender.stickerId = stickerId
    if (notificationDisabled != undefined) sender.notificationDisabled = notificationDisabled

    let { headers } = await pushMessage(token.accessToken, sender)
    let result = {
      remaining: parseInt(headers['x-ratelimit-remaining']),
      image: parseInt(headers['x-ratelimit-imageremaining']),
      reset: parseInt(headers['x-ratelimit-reset']) * 1000
    }
    await ServiceOauth.updateOne({ room, service }, { $set: { limit: result } })
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json(result)
  } catch (ex) {
    logger.error(ex)
    if (outbound) await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
