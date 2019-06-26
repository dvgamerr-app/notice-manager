const mongo = require('../mongodb')
 
module.exports = async (req, res) => {
  let { bot, id } = req.params
  try {
    let updated = { updated: new Date() }
    if (!id) {
      let filter = { executed: false, executing: false, botname: bot }
      let data = await mongo.get('LineCMD').find(filter, null, { limit: 100 })
      res.json(data || [])
    } else {
      let where = id !== 'clear'? { _id: id } : { botname: bot }
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
