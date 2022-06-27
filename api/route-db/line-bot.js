const { notice } = require('@touno-io/db/schema')

module.exports = async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) { return reply.status(404).send({}) }

  const { bot } = req.params

  const { LineBot, LineBotRoom } = notice.get()
  if (bot) {
    return await LineBotRoom.find({ service: bot, userId }, '_id userId service room name type active created', { $sort: { service: 1 } })
  } else {
    return await LineBot.find({ }, '_id userId service name active created', { $sort: { service: 1 } })
  }
}
