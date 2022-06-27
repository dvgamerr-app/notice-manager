const { notice } = require('@touno-io/db/schema')

module.exports = async (req) => {
  const data = req.payload

  const { ServiceBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceBotOauth

  const id = data._id
  delete data._id
  await ServiceBot.updateOne({ _id: id }, data)
  return {}
}
