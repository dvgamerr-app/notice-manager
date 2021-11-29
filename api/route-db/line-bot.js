const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const { bot } = req.params

  const { LineBot, LineBotRoom } = notice.get()
  if (bot) {
    return await LineBotRoom.find({ service: bot }, '_id userId service room name type active created', { $sort: { service: 1 } })
  } else {
    return await LineBot.find({ }, '_id userId service name active created', { $sort: { service: 1 } })
  }
}
