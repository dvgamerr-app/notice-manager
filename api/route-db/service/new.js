const { notice } = require('@touno-io/db/schema')
const { loggingLINE } = require('../../logging')

module.exports = async (req) => {
  const userId = req.headers['x-id']
  const data = req.payload
  const { ServiceBot } = notice.get()
  if (await ServiceBot.findOne({ service: data.name, active: true })) { throw new Error('name is duplicate.') }
  const found = await ServiceBot.findOne({ service: data.name }) || {}

  let serviceId = found._id
  if (!found._id) {
    const saved = await new ServiceBot({
      name: data.name,
      service: data.name,
      client: data.client_id,
      secret: data.client_secret,
      userId
    }).save()
    serviceId = saved._id
  } else {
    await ServiceBot.updateOne({ name: data.name, active: false }, {
      $set: {
        client: data.client_id,
        secret: data.client_secret,
        active: true,
        userId
      }
    })
  }
  await loggingLINE(`Notify service add *${data.name}*`)
  return { _id: serviceId }
}
