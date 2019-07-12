import numeral from 'numeral'
import moment from 'moment'
import request from 'request-promise'
import { slackMessage, pkgChannel, pkgName } from './index'
import mongo from '../line-bot'

export const cmdExpire = async () => {
  const { LineCMD } = mongo.get()
  await LineCMD.updateMany({ created : { $lte: new Date(+new Date() - 300000) }, executing: false, executed: false }, {
    $set: { executed: true }
  })
}
export const logingExpire = async (month = 3) => {
  if (month <= 0) return
  let expire = moment().startOf('month').add(month * -1, 'month').toDate()
  let { LineOutbound, LineInbound, LineCMD } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  
  let dataIn = await LineInbound.deleteMany({ created: { $lte: expire } })
  let dataOut = await LineOutbound.deleteMany({ created: { $lte: expire } })
  let dataCmd = await LineCMD.deleteMany({ created: { $lte: expire } })
  let msg = `Logging documents delete if over ${month} months.`
	let blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: msg }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ([
          dataIn.n ? `• *Line Inbound* ${dataIn.n} rows.` : null,
          dataOut.n ? `• *Line Outbound* ${dataOut.n} rows.` : null,
          dataCmd.n ? `• *Line CMD* ${dataCmd.n} rows.` : null
        ]).filter(e => e !== null).join('\n')
      }
    }
  ]
  if (dataIn.n || dataOut.n || dataCmd.n) await slackMessage(pkgChannel, pkgName, { text: msg, blocks })
}

export const statsPushMessage = async () => {
  const { LineBot, ServiceBot, LineOutbound } = mongo.get()
  const inDate = moment().startOf('month').toDate()
  const msg = `Logging usage of month report.`
  const format = (name, n) => `• *${name}* ${numeral(n).format('0,0')} rows.`
	let blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: msg } }
  ]

  let linebot = [ `*LINE BOT*` ]
  for (const bot of (await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } }))) {
    let count = await LineOutbound.countDocuments({
      botname: bot.botname,
      type: { $in: [ 'group', 'user', 'room' ] },
      created: { $gte: inDate }
    })
    linebot.push(format(bot.name, count))
  }
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: linebot.join('\n') }
  })

  let linenoti = [ `*LINE Notify*` ]
  for (const bot of (await ServiceBot.find({ active: true }, null, { sort: { service: 1 } }))) {
    let count = await LineOutbound.countDocuments({
      botname: bot.service,
      type: 'notify',
      created: { $gte: inDate }
    })
    linenoti.push(format(bot.name, count))
  }
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: linenoti.join('\n') }
  })
  await slackMessage(pkgChannel, pkgName, { text: msg, blocks })
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