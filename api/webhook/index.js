// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req) => {
  const { id } = req.params
  const { LineOutbound } = notice.get()
  const data = (await LineOutbound.findOne({ _id: id })) || {}
  if (!data) {
    return {}
  }

  return typeof data.sender === 'string' ? JSON.parse(data.sender) : data.sender
}
