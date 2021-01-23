const { notice } = require('@touno-io/db/schema')
const { setRevoke } = require('../sdk-notify')
const { loggingLINE } = require('../logging')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { revoke } = req.payload

  const { ServiceOauth } = notice.get()

  const token = await ServiceOauth.findOne({ service, room, accessToken: { $ne: null } })
  if (!token) { throw new Error('Service and room not register.') }
  if (revoke !== 'agree') { throw new Error('Please confirm revoke parameter') }
  const data = await setRevoke(token.accessToken)
  if (data.status !== 200) { throw new Error('Revoke Service fail.') }
  await ServiceOauth.updateOne({ service, room }, { $set: { accessToken: null } })
  await loggingLINE(`Rovoke room *${room}* from *${service}*`)
  return {}
}
