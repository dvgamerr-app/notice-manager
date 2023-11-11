// const logger = require('@touno-io/debuger')('notify')
// const { notice } = require('@touno-io/db/schema')
const { getStatus, setRevoke, pushNotify } = require('./sdk-line')

const getToken = async (serviceName, roomName) => {
  // const { ServiceBotOauth } = notice.get()
  // const oauth = await ServiceBotOauth.findOne({ service, room })
  // if (!oauth || !oauth.accessToken) {
  //   throw new Error(`OAuth: ${service} in ${room}, No accessToken.`)
  // }
  return ''
}

module.exports = async (serviceName, roomName) => {
  let accessToken = serviceName
  if (roomName) accessToken = await getToken(serviceName, roomName)

  return {
    pushNotify: message => pushNotify(accessToken, message),
    getStatus: () => getStatus(accessToken),
    setRevoke: () => setRevoke(accessToken)
  }
}
