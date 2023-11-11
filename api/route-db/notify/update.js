// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req) => {
  const data = req.body

  const { ServiceBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceBotOauth

  const id = data._id
  delete data._id
  await ServiceBot.updateOne({ _id: id }, data)
  return {}
}
