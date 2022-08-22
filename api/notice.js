const { monitorLINE } = require('./monitor')

module.exports = async (req) => {
  const { msg } = req.params
  await monitorLINE(msg)
  return {}
}
