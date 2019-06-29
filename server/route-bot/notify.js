import debuger from '@touno-io/debuger'
import { pushMessage } from '../api-notify'
import mongo from '../mongodb'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { message } = req.body
  let outbound = null
  
  await mongo.open()
  const { ServiceBot, ServiceOauth, LineOutbound } = mongo.get()

  try {
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

    let { headers } = await pushMessage(token.accessToken, message)
    let result = {
      remaining: parseInt(headers['x-ratelimit-remaining']),
      image: parseInt(headers['x-ratelimit-imageremaining']),
      reset: parseInt(headers['x-ratelimit-reset']) * 1000
    }
    await ServiceBot.updateOne({ room, service }, { $set: { 'limit.remaining': result.remaining, 'limit.reset': result.reset } })
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json(result)
  } catch (ex) {
    logger.error(ex)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
