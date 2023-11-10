// const logger = require('@touno-io/debuger')('API')
const pkg = require('../package.json')
const { sendMessage } = require('./telegram/sdk')

const pkgName = `LINE-BOT v${pkg.version}`
const botName = process.env.TELEGRAM_TOKEN
const roomName = process.env.TELEGRAM_CHAT

// logger.info('Telegram Monitor:', !(!botName || !roomName))
module.exports = {
  pkgName,
  monitorLINE: async (ex) => {
    if (!botName || !roomName) {
      return
    }
    if (ex instanceof Error) {
      if (ex.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        ex = `Code: ${ex.response.status} - ${JSON.stringify(ex.response.data)}`
      } else if (ex.request) {
        ex = ex.request
      } else {
        // Something happened in setting up the request that triggered an ex
        ex = ex.message
          ? `*${(ex.message || '').substring(0, 200)}*\n${(
              ex.stack || ''
            ).substring(0, 200)}`
          : ex
      }
    }
    await sendMessage(botName, roomName, { message: `*${pkgName}* ... ${ex}` })
  }
}
