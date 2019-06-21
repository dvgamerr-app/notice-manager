const mongo = require('../mongodb')

module.exports = async (req, res) => {
  let { ServiceBot, ServiceOauth } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let service = await ServiceBot.find({}, null, { sort: { name: 1 } })
    let room = await ServiceOauth.find({}, null, { sort: { name: 1 } })
    let groups = service.map(e => ({
      _id: e._id,
      name: e.name,
      service: e.service,
      room: room.filter(r => r.service === e.service).map(e => ({ service: e.service, room: e.room, _id: e._id }))
    }))
    res.json(groups)
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}