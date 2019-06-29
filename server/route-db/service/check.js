import mongo from '../../mongodb'

export default async (req, res) => {
  let { service, room } = req.body
  let { ServiceOauth, ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    if (service && room) {
      if (await ServiceOauth.findOne({ service, room, accessToken: { $ne: null } })) throw new Error('Room is duplicate.')
    } else if (service) {
      if (await ServiceBot.findOne({ service, active: { $ne: false } })) throw new Error('Room is duplicate.')
    }
    res.json({})
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
