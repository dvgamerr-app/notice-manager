const { notice } = require('@touno-io/db/schema')
const logger = require('@touno-io/debuger')('API')

module.exports = async (req, res) => {
  try {
    await notice.open()
    const data = await notice.get('LineCMDWebhook').find({ active: true }, null, { sort: { botname: 1, command: -1 } })
    res.json(data || [])
  } catch (ex) {
    logger.error(ex)
    res.status(500).json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
