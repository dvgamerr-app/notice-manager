const sdk = require('@line/bot-sdk')
const { notice } = require('@touno-io/db/schema')

module.exports = async (req, res) => {
  const { bot, to } = req.params

  let outbound = null
  let roomId = to
  try {
    await notice.open()
    const { LineOutbound, LineBot, LineBotRoom } = notice.get()

    if (!/^[RUC]{1}/g.test(roomId) && (!/[0-9a-f]*/.test(roomId) || roomId.length !== 32)) {
      const room = await LineBotRoom.findOne({ botname: bot, name: roomId })
      if (!room || !room.active) { throw new Error('Room name is unknow.') }
      roomId = room.id
    }

    const client = await LineBot.findOne({ botname: bot })
    if (!client) { throw new Error('LINE API bot is undefined.') }
    outbound = await new LineOutbound({
      botname: bot,
      userTo: roomId,
      type: roomId.startsWith('R') ? 'room' : roomId.startsWith('C') ? 'group' : roomId.startsWith('U') ? 'user' : 'replyToken',
      sender: req.body || {},
      sended: false,
      error: null,
      created: new Date()
    }).save()
    if (!req.body.type) { throw new Error('LINE API fail formatter.') }
    const { accesstoken, secret } = client
    if (!accesstoken || !secret) { throw new Error('LINE Channel AccessToken is undefined.') }

    const line = new sdk.Client({ channelAccessToken: accesstoken, channelSecret: secret })
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
    if (!/^[RUC]{1}/g.test(roomId)) {
      await line.replyMessage(roomId, req.body)
    } else {
      await line.pushMessage(roomId, req.body)
    }
    res.json({ error: null })
  } catch (ex) {
    res.json({ error: ex.message || ex.toString(), type: req.body.type })
    if (outbound && outbound._id) {
      await notice.get('LineOutbound').updateOne({ _id: outbound._id }, { $set: { error: ex.message || ex.toString() } })
    }
  } finally {
    res.end()
  }
}
