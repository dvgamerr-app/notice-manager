const { notice } = require('@touno-io/db/schema')
const { getStatus } = require('../sdk-line')

module.exports = async (req) => {
  const { ServiceBotOauth } = notice.get()
  const tokenItems = await ServiceBotOauth.find({ accessToken: { $ne: null } })

  if (tokenItems.length === 0) {
    throw new Error('Service LINE-Notice not register.')
  }
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
      await ServiceBotOauth.updateOne(
        { _id: e._id },
        { $set: { accessToken: null } }
      )
    }
  }
  return result
}
