import mongo from '../mongodb'

export default async (req, res) => {
    const { bot } = req.params
  res.json((await mongo.get('LineInbound').find({ botname: bot }, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
}
