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
  let data = { params: req.params }
  if (name === 'error') {
    data.body = await flex.error(app, { message, stack: detail }, true)
    await linePush(data, res)
  } else if (name === 'alert') {
    data.body = await flex.alert(app, message, detail, '#009688', true)
    await linePush(data, res)
  } else {
    res.json({ error: 'flex message is undefined.' })
  }
}
