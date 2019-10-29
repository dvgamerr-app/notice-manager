import mongo from '../mongodb'

export default async (req, res) => {
  try {
    let data = await mongo.get('LineCMDWebhook').find({ active: true }, null, { sort: { botname: 1,  command: -1 }})
    res.json(data || [])
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
