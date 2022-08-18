const { notice } = require('@touno-io/db/schema')

module.exports = async (req, res) => {
  const data = await notice
    .get('LineCMDWebhook')
    .find({ active: true }, null, { sort: { botname: 1, command: -1 } })
  return data || []
}
