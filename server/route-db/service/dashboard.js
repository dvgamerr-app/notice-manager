import mongo from '../../mongodb'

export default async (req, res) => {
  const { LineBot, LineBotRoom, ServiceBot, ServiceOauth, ChatWebhook } = mongo.get() // LineInbound, LineOutbound, LineCMD,
  try {
    const webhook = await ChatWebhook.find({ active: true }, null, { sort: { botname: 1 } })
    const bot = await LineBot.find({ active: true }, null, { sort: { botname: 1 } })
    const room = await LineBotRoom.find({ active: true }, null, { sort: { botname: 1, name: 1 } })
    const service = await ServiceBot.find({ active: true }, null, { sort: { name: 1 } })
    const oauth = await ServiceOauth.find({ accessToken: { $ne: null } }, null, { sort: { service: 1, name: 1 } })
    res.json({
      service: service.map(e => ({
        _id: e._id,
        text: e.name,
        value: e.service,
        room: oauth.filter(r => r.service === e.service && r.accessToken).map(e => ({ service: e.service, value: e.room, text: e.name, _id: e._id }))
      })),
      bot: bot.map(e => ({
        _id: e._id,
        text: e.name,
        value: e.botname,
        stats: e.options && e.options.stats ? e.options.stats : {},
        room: room.filter(r => r.botname === e.botname && r.active).map(e => ({ botname: e.botname, value: e.name, text: e.name, _id: e._id }))
      })),
      webhook: webhook.map(e => ({
        _id: e._id,
        botname: e.botname,
        name: e.name,
        type: e.type
      }))
    })
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
