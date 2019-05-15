const mongo = require('../mongodb')

module.exports = async (req, res) => {
    // let { p } = req.params
  res.json((await mongo.get('LineOutbound').find({}, null, { sort: { created: -1 }, skip: 0, limit: 1000 })) || [])
  res.end()
}
