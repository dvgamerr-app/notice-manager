const axios = require('axios')
const moment = require('moment')
const { notice } = require('@touno-io/db/schema')

const getStats = async (accesstoken) => {
  const date = moment()
  const opts = { headers: { Authorization: `Bearer ${accesstoken}` } }
  const { data: quota } = await axios('https://api.line.me/v2/bot/message/quota', opts)
  const { data: consumption } = await axios('https://api.line.me/v2/bot/message/quota/consumption', opts)
  const { data: reply } = await axios(`https://api.line.me/v2/bot/message/delivery/reply?date=${date.format('YYYYMMDD')}`, opts)
  const { data: push } = await axios(`https://api.line.me/v2/bot/message/delivery/push?date=${date.format('YYYYMMDD')}`, opts)

  return {
    usage: consumption.totalUsage,
    limited: quota.type === 'limited' ? quota.value : 0,
    reply: reply.status === 'ready' ? reply.success : reply.status,
    push: push.status === 'ready' ? push.success : push.status,
    updated: date.toDate()
  }
}

module.exports = async (req) => {
  const { name } = req.params
  const { LineBot } = notice.get()
  if (!name) {
    for await (const bot of await LineBot.find()) {
      const stats = await getStats(bot.accesstoken)
      await LineBot.updateOne({ _id: bot._id }, { $set: { options: { stats } } })
    }
    return { }
  }

  const { _id, accesstoken, options } = await LineBot.findOne({ botname: name })
  let stats = options.stats
  if (moment().diff(moment(options.stats.updated), 'hour') > 23) {
    stats = await getStats(accesstoken)
    await LineBot.updateOne({ _id }, { $set: { options: { stats } } })
  }
  return stats
}
