import mongo from '../mongodb'

export default async (req, res) => {
  const { bot, id } = req.params
  try {
    if (!bot) {
      const data = await mongo.get('LineCMD').find({
        executed: false,
        executing: false
      }, null, { limit: 100, sort: { created: -1, executed: 1 } })
      res.json(data || [])
    } else if (!id) {
      const filter = { executed: false, executing: false, botname: bot }
      const data = await mongo.get('LineCMD').find(filter, null, { limit: 10 })
      res.json(data || [])
    } else {
      const updated = { updated: new Date() }
      const where = id !== 'clear' ? { _id: id } : { botname: bot }
      await mongo.get('LineCMD').updateMany(where, {
        $set: Object.assign(updated, (Object.keys(req.body).length > 0 ? req.body : { executed: true, executing: true }))
      })
      res.json({ error: null })
    }
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
