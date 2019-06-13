const request = require('request-promise')
const mongo = require('../mongodb')

module.exports = async (req, res) => {
  const { LineBot } = mongo.get()
  console.log('slack', req.body, req.params)
  try {
    const client = await LineBot.findOne({ botname: 'ris-sd3' })

    if (!client.channel) throw new Error('Slack Hooks API is undefined.')
    let result = await request({ url: client.channel, method: 'POST', body: req.body, json: true })
    if (result !== 'ok') throw new Error(result)
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString() })
  } finally {
    res.end()
  }
}
