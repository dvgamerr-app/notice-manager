import numeral from 'numeral'
import moment from 'moment'
import request from 'request-promise'
import { slackMessage } from './index'
import mongo from '../line-bot'
import pkg from '../../package.json'

const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`

const slackStats = (app, data) => {
  data = data.map(e => {
    return {
      type: `mrkdwn`,
      text: `*${e.name}* ${e.stats.limited ? ` (limit ${e.stats.limited})` : ''} *:*\n${numeral(e.stats.reply + e.stats.push).format('0,0')} (monthly ${numeral(e.stats.usage).format('0,0')}) `
    }
  })
  
  return { pretext: `${app} stats usage daily.`, blocks: [ { type: `section`, fields: data } ] }
}

export const cmdExpire = async () => {
  const { LineCMD } = mongo.get()
  await LineCMD.updateMany({ created : { $lte: new Date(+new Date() - 300000) }, executing: false, executed: false }, {
    $set: { executed: true }
  })
}

export const statsPushMessage = async () => {
  let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
  data = data.map(e => {
    return { botname: e.botname, name: e.name, stats: e.options.stats }
  })
  
  await slackMessage(pkgChannel, pkgName, slackStats(pkgName, data))
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