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
  let msg = 'Logging *LINT-BOT* documents expire over 3 months.'
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
          dataIn.n ? `• Line Inbound ${dataIn.n} rows.` : null,
          dataOut.n ? `• Line Outbound ${dataOut.n} rows.` : null,
          dataCmd.n ? `• Line CMD ${dataCmd.n} rows.` : null
        ]).filter(e => e !== null).join('\n')
      }
    }
  ]
  await slackMessage(pkgChannel, pkgName, { text: msg, blocks })
}

export const statsPushMessage = async () => {
  let { LineBot, LineOutbound } = mongo.get()
  let linebot = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
  for (const line of linebot) {
    
    let count = await LineOutbound.countDocuments({
      botname: line.botname,
      created: { $gte: moment().startOf('month').toDate() }
    })
    console.log(`- ${line.botname} usage ${count} `)
  }
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