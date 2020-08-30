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
    const date = moment().add(-1, 'day')

    const { accesstoken } = await LineBot.findOne({ _id: id })
    const opts = { headers: { Authorization: `Bearer ${accesstoken}` }, json: true }

    const quota = await request('https://api.line.me/v2/bot/message/quota', opts)
    const consumption = await request('https://api.line.me/v2/bot/message/quota/consumption', opts)
    const reply = await request(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
    const push = await request(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

    const stats = {
      usage: consumption.totalUsage,
      limited: quota.type === 'limited' ? quota.value : 0,
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
