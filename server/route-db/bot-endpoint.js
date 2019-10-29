import mongo from '../mongodb'

export default async (req, res) => {
  try {
    let data = await mongo.get('LineCMDWebhook').find({ active: true }, null)
    res.json(data || [])
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
