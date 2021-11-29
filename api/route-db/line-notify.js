const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const { notify } = req.params

  const { ServiceBot, ServiceBotOauth } = notice.get()
  if (notify) {
    return await ServiceBotOauth.find({ service: notify, accessToken: { $ne: null } }, '_id userId service room name created', { $sort: { service: 1 } })
  } else {
    return await ServiceBot.find({}, '_id userId service name active created', { $sort: { service: 1 } })
  }
}
