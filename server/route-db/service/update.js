import mongo from '../../mongodb'
export default async (req, res) => {
  let data = req.body
  let { ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    let id = data._id
    delete data._id
    await ServiceBot.updateOne({ _id: id }, data)
    res.json({})
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
