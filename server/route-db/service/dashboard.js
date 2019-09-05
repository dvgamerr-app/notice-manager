import mongo from '../../mongodb'

export default async (req, res) => {
  let { LineBot, ServiceBot, ServiceOauth, ChatWebhook } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let webhook = await ChatWebhook.find({ active: true }, null, { sort: { botname: 1 } })
    let bot = await LineBot.find({ active: true }, null, { sort: { botname: 1 } })
    let service = await ServiceBot.find({ active: true }, null, { sort: { name: 1 } })
    let room = await ServiceOauth.find({ accessToken: { $ne: null } }, null, { sort: { name: 1 } })
    res.json({ 
      service: service.map(e => ({
        _id: e._id,
        name: e.name,
        service: e.service,
        room: room.filter(r => r.service === e.service && r.accessToken).map(e => ({ service: e.service, room: e.room, name: e.name, _id: e._id }))
      })),
      bot: bot.map(e => ({
        _id: e._id,
        name: e.name,
        botname: e.botname,
        stats: e.options ? e.options.stats : {}
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