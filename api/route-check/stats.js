const { notice } = require('@touno-io/db/schema')
const { getStatus } = require('../sdk-notify')

module.exports = async (req) => {
  const { ServiceOauth } = notice.get()

  const tokenItems = await ServiceOauth.find({ accessToken: { $ne: null } })
  if (tokenItems.length === 0) { throw new Error('Service LINE-Notice not register.') }
  const result = []
  for (const e of tokenItems) {
    const res = await getStatus(e.accessToken)
    result.push({
      online: res.status === 200,
      service: e.service,
      room: e.room,
      type: res.targetType,
      target: res.target
    })
    if (res.status !== 200) {
      await ServiceOauth.updateOne({ _id: e._id }, { $set: { accessToken: null } })
    }
  }
  return result
}
