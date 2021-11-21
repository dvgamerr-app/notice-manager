const logger = require('@touno-io/debuger')('notify')
const { notice } = require('@touno-io/db/schema')


const getToken = async (service, room) => {
  if (!service || !room) { return logger.log('No service, No room.') }

  const { ServiceBotOauth } = notice.get()
  const oauth = await ServiceBotOauth.findOne({ service, room })
  if (!oauth || !oauth.accessToken) { return logger.log(`Oauth: ${service} in ${room}, No access token.`) }
  return oauth.accessToken
}

module.exports = async (service, room) => {
  const accesstoken = await getToken(service, room)
  return {
    pushNotify: message => pushNotify(accesstoken, message),
    getStatus: () => getStatus(accesstoken),
    setRevoke: () => setRevoke(accesstoken)
  }
}
