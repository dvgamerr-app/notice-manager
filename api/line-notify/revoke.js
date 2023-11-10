// const { notice } = require('@touno-io/db/schema')
const notice = {}
const { setRevoke } = require('../sdk-notify')
const { monitorLINE } = require('../monitor')

module.exports = async (req, res) => {
  // Authorization oauth2 URI
  const { room, service } = req.params
  const { revoke } = req.body

  const { ServiceBotOauth } = notice.get()

  const token = await ServiceBotOauth.findOne({
    service,
    room,
    accessToken: { $ne: null }
  })
  if (!token) {
    throw new Error('Service and room not register.')
  }
  if (revoke !== 'agree') {
    throw new Error('Please confirm revoke parameter')
  }
  const data = await setRevoke(token.accessToken)
  if (data.status !== 200) {
    throw new Error('Revoke Service fail.')
  }
  await ServiceBotOauth.updateOne(
    { service, room },
    { $set: { accessToken: null } }
  )
  await monitorLINE(`Rovoke room *${room}* from *${service}*`)
  return { OK: true }
}
