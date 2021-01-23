const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const { service, room } = req.payload

  const { ServiceOauth, ServiceBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth

  if (service && room) {
    if (await ServiceOauth.findOne({ service, room, accessToken: { $ne: null } })) { throw new Error('Room is duplicate.') }
  } else if (service) {
    if (await ServiceBot.findOne({ service, active: { $ne: false } })) { throw new Error('Room is duplicate.') }
  }
  return {}
}
