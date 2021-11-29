const sdk = require('@line/bot-sdk')
const { notice } = require('@touno-io/db/schema')

module.exports = async (botName) => {
  const { LineBot } = notice.get()
  const client = await LineBot.findOne({ service: botName })

  if (!client) { throw new Error('LINE API bot is undefined.') }
  const { accesstoken } = client

  if (!accesstoken) { throw new Error('LINE Channel AccessToken is undefined.') }

  const line = new sdk.Client({ channelAccessToken: accesstoken })
  const convertSender = msg => typeof msg === 'string' ? { type: 'text', text: msg } : typeof msg === 'function' ? msg() : msg
  const linePushId = ({ source }) => source[`${source.type}Id`]
  const pushMessage = async (to, sender) => {
    if (!sender) { return {} }

    if (typeof to === 'string') {
      if (!/^[RUC]{1}/g.test(to)) {
        return await line.replyMessage(to, convertSender(sender))
      } else {
        return await line.pushMessage(to, convertSender(sender))
      }
    } else if (to.replyToken) {
      return await line.replyMessage(to.replyToken, convertSender(sender))
    } else {
      return await line.pushMessage(linePushId(to), convertSender(sender))
    }
  }

  return { line, pushMessage }
}
