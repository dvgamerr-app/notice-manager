const { notice } = require('@touno-io/db/schema')

module.exports = async (req, res) => {
  const data = req.body
  try {
    await notice.open()
    const { ServiceBot } = notice.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth

    const id = data._id
    delete data._id
    await ServiceBot.updateOne({ _id: id }, data)
    res.json({})
  } catch (ex) {
    res.status(500).json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
