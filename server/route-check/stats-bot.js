import debuger from '@touno-io/debuger'
import request from 'request-promise'
import moment from 'moment'
import mongo from '../line-bot'

const logger = debuger('Notify')

export default async (req, res) => {
  // Authorization oauth2 URI
  const { id } = req.params
  try {
    const { LineBot } = mongo.get()
    let date = moment().add(-1, 'day')
  
    let { accesstoken } = await LineBot.findOne({ _id: id })
    const opts = { headers: { 'Authorization': `Bearer ${accesstoken}` }, json: true }

    let quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    let consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    let reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
    let push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

    let stats = {
      usage : consumption.totalUsage,
      limited : quota.type === 'limited' ? quota.value : 0,
      reply: reply.status === 'ready' ? reply.success : reply.status,
      push: push.status === 'ready' ? push.success : push.status,
      updated: date.toDate()
    }
    await LineBot.updateOne({ _id: id }, { $set: { options: { stats } } })

    res.json(stats)
  } catch (ex) {
    logger.error(ex)
    res.json({ error: ex.message || ex })
  } finally {
    res.end()
  }
}
