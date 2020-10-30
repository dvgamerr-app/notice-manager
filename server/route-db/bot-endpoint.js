const { notice } = require('@touno-io/db/schema')

module.exports = async (req, res) => {
  try {
    await notice.open()
    const data = await notice.get('LineCMDWebhook').find({ active: true }, null, { sort: { botname: 1, command: -1 } })
    res.json(data || [])
  } catch (ex) {
    res.status(500).json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
