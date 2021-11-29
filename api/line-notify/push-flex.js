const flexAlert = require('../flex/alert')
const flexError = require('../flex/error')
const pushMessagehandler = require('../line-bot/message')

module.exports = async (req, res) => {
  const { name } = req.params
  const { app, message, detail, botname } = req.payload
  req.params.bot = botname || 'health-check'

  if (!app || !message) { return res.json({ error: 'app, message, detail is undefined.' }) }
  const data = { params: req.params }
  if (name === 'error') {
    data.body = await flexError(app, { message, stack: detail }, true)
    await pushMessagehandler(data, res)
  } else if (name === 'alert') {
    data.body = await flexAlert(app, message, detail, '#009688', true)
    await pushMessagehandler(data, res)
  } else {
    res.json({ error: 'flex message is undefined.' })
  }
}
