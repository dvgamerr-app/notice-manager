const linePush = require('./push-message')
const flex = {
  alert: require('../flex/alert'),
  error: require('../flex/error')
}

module.exports = async (req, res) => {
  let { name } = req.params
  req.params.bot = 'health-check'
  let { app, message, detail } = req.body
  if (!app || !message) return res.json({ error: 'app, message, detail is undefined.' })

  if (name === 'error') {
    req.body = await flex.error(app, { message, stack: detail }, true)
    await linePush(req, res)
  } else if (name === 'alert') {
    req.body = await flex.alert(app, message, detail, '#009688', true)
    await linePush(req, res)
  } else {
    res.json({ error: 'flex message is undefined.' })
  }
}
