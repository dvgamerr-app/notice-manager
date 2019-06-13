const request = require('request-promise')
const mongo = require('../mongodb')

module.exports = async (req, res) => {
  const { LineBot } = mongo.get()
  const { channel } = req.params
  const { UserId, Msg } = req.body
  try {
    const client = await LineBot.findOne({ botname: 'slack-sd3' })

    if (!client.channel && !channel) throw new Error('Slack Hooks API is undefined.')
    let result = await request({
      url: client.channel,
      method: 'POST',
      body: {
        channel: `#${channel}`,
        username: UserId,
        text: Msg.replace(/\[newline]/ig, '\n'),
        mrkdwn: true
      },
      json: true
    })
    if (result !== 'ok') throw new Error(result)
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString() })
  } finally {
    res.end()
  }
}
