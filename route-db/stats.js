const mongo = require('../mongodb')

module.exports = async (req, res) => {
  let { LineBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, 
  try {
    let data = await LineBot.find({ type: 'line' }, null, { sort: { botname: 1 } })
    data = data.map(e => {
      return {
        botname: e.botname,
        name: e.name,
        stats: e.options.stats
      }
    })
    return res.json(data)
  } catch (ex) {
    ex
  }
  res.end()
}