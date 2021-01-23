const sdk = require('@line/bot-sdk')
const { notice } = require('@touno-io/db/schema')

module.exports = async (botname) => {
  const { LineBot } = notice.get()
  const client = await LineBot.findOne({ botname })

  if (!client) { throw new Error('LINE API bot is undefined.') }
  const { accesstoken, secret } = client

  if (!accesstoken || !secret) { throw new Error('LINE Channel AccessToken is undefined.') }

  const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
  const convertSender = msg => typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
  const linePushId = ({ source }) => source[`${source.type}Id`]
  const pushMessage = async (to, sender) => {
    if (!sender) { return }

    if (typeof to === 'string') {
      if (!/^[RUC]{1}/g.test(to)) {
        await line.replyMessage(to, convertSender(sender))
      } else {
        await line.pushMessage(to, convertSender(sender))
      }
    } else if (to.replyToken) {
      await line.replyMessage(to.replyToken, convertSender(sender))
    } else {
      await line.pushMessage(linePushId(to), convertSender(sender))
    }
  }

  return { line, pushMessage }
}
