const { notice } = require('@touno-io/db/schema')
const debuger = require('@touno-io/debuger')

const logger = debuger('WEBHOOK')

module.exports = async (req, res) => {
  const { id } = req.params
  try {
    await notice.open()
    const { LineOutbound } = notice.get()
    const data = await LineOutbound.findOne({ _id: id }) || {}
    res.json(data.sender || { error: 'empty' })
  } catch (ex) {
    logger.error(ex)
    res.status(ex.error ? ex.error.status : 500)
    res.json({ error: (ex.error ? ex.error.message : ex.message || ex) })
  } finally {
    res.end()
  }
}
