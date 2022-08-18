const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const { service, room } = req.body
  const { ServiceBotOauth, ServiceBot } = notice.get()

  if (service && room) {
    if (
      await ServiceBotOauth.findOne({
        service,
        room,
        accessToken: { $ne: null }
      })
    ) {
      return { error: 'Room is duplicate.' }
    }
  } else if (service) {
    if (await ServiceBot.findOne({ service, active: { $ne: false } })) {
      return { error: 'Service is duplicate.' }
    }
  }
  return { error: false }
}
