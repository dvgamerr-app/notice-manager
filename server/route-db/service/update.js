import mongo from '../../mongodb'

export default async (req, res) => {
  let data = req.body
  let { ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    await ServiceBot.updateOne({ _id: data._id }, {
      name: data.name,
      active: data.active
    })
    res.json({})
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
