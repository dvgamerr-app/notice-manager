// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) {
    return reply.status(404).send({})
  }

  const { notify } = req.params
  const { ServiceBot, ServiceBotOauth } = notice.get()
  if (notify) {
    return await ServiceBotOauth.find(
      { service: notify, userId, accessToken: { $ne: null } },
      '_id userId service room name created',
      { $sort: { service: 1 } }
    )
  } else {
    return await ServiceBot.find({}, '_id userId service name active created', {
      $sort: { service: 1 }
    })
  }
}
