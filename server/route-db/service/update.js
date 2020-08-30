import mongo from '../../mongodb'
export default async (req, res) => {
  const data = req.body
  const { ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    const id = data._id
    delete data._id
    await ServiceBot.updateOne({ _id: id }, data)
    res.json({})
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
