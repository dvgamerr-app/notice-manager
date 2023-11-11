// const logger = require('@touno-io/debuger')('notify')
// const { notice } = require('@touno-io/db/schema')
const notice = {}
const { getStatus, setRevoke, pushNotify } = require('./sdk-line')

const getToken = async (service, room) => {
  if (!service || !room) {
    // return logger.log('No service, No room.')
  }

  const { ServiceBotOauth } = notice.get()
  const oauth = await ServiceBotOauth.findOne({ service, room })
  if (!oauth || !oauth.accessToken) {
    throw new Error(`OAuth: ${service} in ${room}, No accessToken.`)
  }
  return oauth.accessToken
}

module.exports = async (service, room) => {
  let accessToken = service
  if (room) accessToken = await getToken(service, room)

  return {
    pushNotify: message => pushNotify(accessToken, message),
    getStatus: () => getStatus(accessToken),
    setRevoke: () => setRevoke(accessToken)
  }
}
