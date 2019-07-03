import mongo from '../../mongodb'
import { getChannal } from '../../helper'

const hosts = process.env.HOSTNAME || 'http://localhost:4000/'
export default async (req, res) => {
  let { LineBot, ServiceBot, ServiceOauth } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let slack = await getChannal()
    let bot = await LineBot.find({ active: true }, null, { sort: { botname: 1 } })
    let service = await ServiceBot.find({ active: true }, null, { sort: { name: 1 } })
    let room = await ServiceOauth.find({ accessToken: { $ne: null } }, null, { sort: { name: 1 } })
    res.json({ 
      hosts,
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
        stats: e.options.stats
      })),
      slack: slack.map(e => ({
        name: e.name,
        topic: e.topic,
        members: e.members.length
      }))
    })
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}