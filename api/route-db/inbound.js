const { notice } = require('@touno-io/db/schema')

module.exports = async (req, res) => {
  const { bot } = req.params
  return (await notice.get('LineInbound').find({ botname: bot }, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || []
}
