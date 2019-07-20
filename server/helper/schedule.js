import numeral from 'numeral'
import moment from 'moment'
import request from 'request-promise'
import { webhookMessage } from './index'
import mongo from '../line-bot'

const cardMessage = (summary, title, sections) => {
  return {
    "@context": "https://schema.org/extensions",
    "@type": "MessageCard",
    "themeColor": "0072C6",
    sections,
    summary,
    title
  }
}

const loggingExpire = async (month = 3) => {
  if (month <= 0) return
  let expire = moment().add(month * -1, 'month').toDate()
  let { LineOutbound, LineInbound, LineCMD } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  
  let dataIn = await LineInbound.deleteMany({ created: { $lte: expire } })
  let dataOut = await LineOutbound.deleteMany({ created: { $lte: expire } })
  let dataCmd = await LineCMD.deleteMany({ created: { $lte: expire } })
  let rows = dataIn.n + dataOut.n + dataCmd.n
  return rows > 0 ? {
    facts: [
      { name: 'Delete it', value: `${numeral(rows).format('0,0')} rows.`  }
    ],
    text: `Logging documents delete if over ${month} months.`
  } : null
}

const loggingStats = async () => {
  const { LineBot, ServiceBot, LineOutbound } = mongo.get()
  const startOfMonth = moment().startOf('month').toDate()

  let facts = []

  for (const bot of (await ServiceBot.find({ active: true }, null, { sort: { service: 1 } }))) {
    let count = await LineOutbound.countDocuments({
      botname: bot.service,
      type: 'notify',
      created: { $gte: startOfMonth }
    })
    facts.push({ name: `Notify: ${bot.name}`, value: `used ${count} times` })
  }

  for (const bot of (await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } }))) {
    let count = await LineOutbound.countDocuments({
      botname: bot.botname,
      type: { $in: [ 'group', 'user', 'room' ] },
      created: { $gte: startOfMonth }
    })
    facts.push({ name: `BOT: ${bot.name}`, value: `used ${count} times` })
  }

  return { facts, text: `Logging usage of daily report.` }
}

export const cmdExpire = async () => {
  const { LineCMD } = mongo.get()
  await LineCMD.updateMany({ created : { $lte: moment().add(-3, 'minute').toDate() }, executing: false, executed: false }, {
    $set: { executed: true }
  })
}

export const loggingPushMessage = async () => {
  let fect1 = await loggingStats()
  let fect2 = await loggingExpire()

  let body = cardMessage('[Heroku] LINE-Notify daily stats.','LINE-Notify daily stats.', ([ fect1, fect2 ]).filter(e => e !== null))
  await webhookMessage('teams', 'line-notify', body)
}

export const lineInitilize = async () => {
  const { LineBot } = mongo.get()
  let date = moment().add(-1, 'day')

  let data = await LineBot.find({ type: 'line' })
  for (const line of data) {
    const opts = { headers: { 'Authorization': `Bearer ${line.accesstoken}` }, json: true }

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
    await LineBot.updateOne({ _id: line._id }, { $set: { options: { stats } } })
  }
}