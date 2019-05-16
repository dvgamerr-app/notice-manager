const mongo = require('../mongodb')
 
module.exports = async (req, res) => {
  let { bot, id } = req.params
  try {
    let where = { _id: id }
    let updated = { updated: new Date() }
    if (!id) {
      let filter = { executed: false, executing: false, botname: bot }
      let data = await mongo.get('LineCMD').find(filter, null, { limit: 100 })
      res.json(data || [])
    } else {
      if (id === 'clear') where = { botname: bot }
      await mongo.get('LineCMD').updateMany(where, {
        $set: Object.assign((req.body ? req.body : { executed: true, executing: true }), updated)
      })
      res.json({ error: null })
    }
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
