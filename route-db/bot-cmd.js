const mongo = require('../mongodb')
 
module.exports = async (req, res) => {
  let { bot, id } = req.params
  try {
    if (!id) {
      let opts = { limit: 100 }
      let filter = { executed: false, executing: false, botname: bot }
    
      res.json((await mongo.get('LineCMD').find(filter, null, opts)) || [])
    } else if (id === 'clear') {
      await mongo.get('LineCMD').updateMany({}, { $set: { updated: new Date(), executed: true, executing: true } })
      res.json({ error: null })
    } else {
      await mongo.get('LineCMD').updateOne({ _id: id }, { $set: { updated: new Date(), executed: true, executing: true } })
      res.json({ error: null })
    }
  } catch (ex) {
    res.json({ error: ex.stack || ex.message || ex })
  }
  res.end()
}
