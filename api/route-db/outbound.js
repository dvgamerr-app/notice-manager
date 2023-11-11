// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req, res) => {
  const { bot } = req.params
  return (
    (await notice.get('LineOutbound').find({ botname: bot }, null, {
      sort: { created: -1 },
      skip: 0,
      limit: 1000
    })) || []
  )
}
