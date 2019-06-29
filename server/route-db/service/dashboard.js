import mongo from '../../mongodb'

const hosts = process.env.HOSTNAME || 'http://localhost:4000/'
export default async (req, res) => {
  let { ServiceBot, ServiceOauth } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let service = await ServiceBot.find({ active: true }, null, { sort: { name: 1 } })
    let room = await ServiceOauth.find({ accessToken: { $ne: null } }, null, { sort: { name: 1 } })
    let groups = service.map(e => ({
      _id: e._id,
      name: e.name,
      service: e.service,
      room: room.filter(r => r.service === e.service && r.accessToken).map(e => ({ service: e.service, room: e.room, name: e.name, _id: e._id }))
    }))
    res.json({ groups, hosts })
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}