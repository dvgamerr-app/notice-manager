import { sendNotify, webhookLogger } from '../../helper'

export default async (req, res) => {
  // Authorization oauth2 URI
  const { botname, userTo } = req.params
  let sender = req.body
  
  await webhookLogger(req, res, async () => {
    if (sender.app && sender.git_log) {
      // Heroku Message.
      await sendNotify(botname, userTo, ` ... *${sender.app} ${sender.release}*\n${sender.git_log}`)
    } else if (typeof sender.payload === 'string') {
      sender = JSON.parse(sender.payload)
      if (sender.username.toLowerCase() === 'gitlab') {
        const fixedMessageSlack = (msg = '') => {
          return msg.replace(/\u003c/ig, '`').replace(/\u003e/ig, '` ').replace(/http:\/\/.*?\|/ig, '')
        }
        let message = sender.fallback
        if (sender.attachments.length > 0) {
          for (const attach of sender.attachments) message += `\n${attach.text}`
        }
        await sendNotify(`gitlab-${sender.channel || 'notify'}`, 'notification', fixedMessageSlack(message))
      }
    }
  }, 'webhook', `${botname}|${userTo}`)
}
