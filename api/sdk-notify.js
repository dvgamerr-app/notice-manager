// const logger = require('@touno-io/debuger')('notify')
// const { notice } = require('@touno-io/db/schema')
const { getStatus, setRevoke, pushNotify } = require('./sdk-line')
const { dbGetOne } = require('./db')

const getToken = async (serviceName, roomName) => {
  const auth = await dbGetOne(`
  SELECT access_token FROM notify_auth a INNER JOIN notify_service s ON a.service = s.service
  WHERE a.service = ? AND a.room = ? AND s.active = true;
  `, [ serviceName, roomName ])
  if (!auth) return null
  return auth.access_token
}

module.exports = async (serviceName, roomName) => {
  let accessToken = serviceName
  if (roomName != undefined) accessToken = await getToken(serviceName, roomName)

  return {
    pushNotify: message => pushNotify(accessToken, message),
    getStatus: () => getStatus(accessToken),
    setRevoke: () => setRevoke(accessToken)
  }
}
