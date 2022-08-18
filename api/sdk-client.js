const linebot = require('linebot')
const { notice } = require('@touno-io/db/schema')

module.exports = async (botName) => {
  const { LineBot } = notice.get()
  const client = await LineBot.findOne({ service: botName })

  if (!client) {
    throw new Error('LINE API bot is undefined.')
  }
  const { accesstoken } = client

  if (!accesstoken) {
    throw new Error('LINE Channel AccessToken is undefined.')
  }

  const bot = linebot({
    channelAccessToken: accesstoken
  })

  // const line = new sdk.Client({ channelAccessToken: accesstoken })
  const convertSender = msg =>
    typeof msg === 'string'
      ? { type: 'text', text: msg }
      : typeof msg === 'function'
        ? msg()
        : msg
  const linePushId = ({ source }) => source[`${source.type}Id`]
  const pushMessage = async (to, sender) => {
    if (!sender) {
      return {}
    }
    if (typeof to === 'string') {
      if (!/^[RUC]{1}/g.test(to)) {
        return await bot.reply(to, convertSender(sender))
      } else {
        return await bot.push(to, convertSender(sender))
      }
    } else if (to.replyToken) {
      return await bot.reply(to.replyToken, convertSender(sender))
    } else {
      return await bot.push(linePushId(to), convertSender(sender))
    }
  }

  return { bot, pushMessage }
}
