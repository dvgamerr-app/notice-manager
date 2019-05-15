const mongo = require('../mongodb')
 

module.exports = async (req, res) => {
  let { bot } = req.params
  let opts = { limit: 100 }
  let filter = { executed: false, botname: bot }

  res.json((await mongo.get('LineCMD').find(filter, null, opts)) || [])
  res.end()
}
