const axios = require('axios')
const moment = require('moment')
const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const { id } = req.params

  const { LineBot } = notice.get()
  const date = moment().add(-1, 'day')

  const { accesstoken } = await LineBot.findOne({ _id: id })
  const opts = { headers: { Authorization: `Bearer ${accesstoken}` } }

  const { data: quota } = await axios('https://api.line.me/v2/bot/message/quota', opts)
  const { data: consumption } = await axios('https://api.line.me/v2/bot/message/quota/consumption', opts)
  const { data: reply } = await axios(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
  const { data: push } = await axios(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

  const stats = {
    usage: consumption.totalUsage,
    limited: quota.type === 'limited' ? quota.value : 0,
    reply: reply.status === 'ready' ? reply.success : reply.status,
    push: push.status === 'ready' ? push.success : push.status,
    updated: date.toDate()
  }
  await LineBot.updateOne({ _id: id }, { $set: { options: { stats } } })

  return stats
}
