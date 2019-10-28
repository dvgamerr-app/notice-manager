import debuger from '@touno-io/debuger'
import request from 'request-promise'
import mongo from '../line-bot'
import pkg from '../../package.json'
import { pushMessage } from '../api-notify'

const logger = debuger(pkg.title)
export const pkgChannel = 'heroku-notify'
export const pkgName = `LINE-BOT v${pkg.version}`

export const notifyLogs = async ex => {
  await mongo.open()
  const { ServiceOauth } = mongo.get()
  const logs = await ServiceOauth.findOne({ service: 'log', room: 'slog' })
  if (ex instanceof Error) {
    ex = ex.message ? `*${(ex.message || '').substring(0, 200)}*\n${(ex.stack || '').substring(0, 200)}` : ex
  }
  if (!logs || !logs.accessToken) return logger.log(ex)
  await pushMessage(logs.accessToken, `*${pkgName}* ... ${ex}`)
}

export const sendNotify = async (service, room, message) => {
  if (!service || !room) return logger.log('No service, No room.')

  await mongo.open()
  const { ServiceOauth } = mongo.get()
  const oauth = await ServiceOauth.findOne({ service, room })
  if (!oauth || !oauth.accessToken) return logger.log(`Oauth: ${service} in ${room}, No access token.`)
  await pushMessage(oauth.accessToken, message)
}

export const webhookLogger = async (req, res, callback, botname = 'webhook', userTo = 'user') => {
  // Authorization oauth2 URI
  let outbound = null
  await mongo.open()
  const { LineOutbound } = mongo.get()

  try {
    outbound = await new LineOutbound({
      botname,
      userTo,
      type: 'notify',
      sender: req.body || {},
      sended: false,
      error: null,
      created: new Date(),
    }).save()
    
    await callback(req, res)
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    res.json({})
  } catch (ex) {
    if (outbound) await LineOutbound.updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}

// const token = process.env.SLACK_TOKEN
// const web = new WebClient(token)

// export const getChannal = async (room) => {
//   let obj = null

//   let list = (await web.channels.list()).channels
//   for (const channel of list) {
//     if (channel.name === room) {
//       obj = channel
//       break
//     }
//   }
//   if (!obj && room) throw new Error('channels is undefined.')
//   return obj || list
// }

// export const slackMessage = async (room, name, sender = { text: 'hello world.' }) => {
//   if (!room || !process.env.SLACK_TOKEN) return

//   let channel = await getChannal(room)
//   if (typeof sender === 'string') sender = { text: sender }
  
//   await web.chat.postMessage(Object.assign({
//     channel: channel.id,
//     username: name
//   }, sender))
// }

// export const slackError = async ex => {
//   if (dev) {
//     logger.error(ex)
//   } else {
//     const icon = 'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png'
//     await slackMessage(pkgChannel, pkgName, {
//       text: ex.message,
//       blocks: [
//         {
//           type: 'context',
//           elements: [ { type: 'image', image_url: icon, alt_text: 'ERROR' }, { type: 'mrkdwn', text: `*${ex.message}*` } ]
//         },
//         { type: 'section', text: { type: 'mrkdwn', text: ex.stack ? ex.stack : '' } }
//       ]
//     })
//   }
// }

export const webhookMessage = async (type, botname, body) => {
  await mongo.open()
  const { ChatWebhook } = mongo.get()
  const chat = await ChatWebhook.findOne({ type, botname })
  await request.post(chat.uri, { body, json: true })
}
