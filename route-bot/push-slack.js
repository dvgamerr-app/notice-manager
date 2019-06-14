const request = require('request-promise')
const mongo = require('../mongodb')

const room = {
  'C1acb90045ec795e6e4755344ffe9a797': 'SD3-CMG',
  'R9eb11dcd932d091f4dd71bbe569b0a98': 'RTE Room'
}

module.exports = async (req, res) => {
  const { LineBot } = mongo.get()
  const { UserId, Msg } = req.body
  let { channel } = req.params
  try {
    const client = await LineBot.findOne({ botname: 'slack-sd3' })

    if (!client.channel ) throw new Error('Slack Hooks API is undefined.')
    if (([]).indexOf(channel) > -1) channel = 'general'

    let result = await request({
      url: client.channel,
      method: 'POST',
      body: {
        channel: `#${channel}`,
        username: room[UserId] || UserId,
        text: (Msg || '').replace(/newline/ig, '`n'),
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
