const { notice } = require('@touno-io/db/schema')
const { monitorLINE } = require('../../monitor')

module.exports = async (req, reply) => {
  const userId = req.headers['x-user-liff']
  if (!userId) { return reply.status(404).send({}) }

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
  await monitorLINE(`Notify service add *${data.name}*`)
  return { _id: serviceId }
}
