// const { notice } = require('@touno-io/db/schema')
const notice = {}

module.exports = async (req, res) => {
  const { bot, id } = req.params
  await notice.open()
  const { LineCMD } = notice.get()
  if (!bot) {
    const data = await LineCMD.find(
      {
        executed: false,
        executing: false
      },
      null,
      { limit: 100, sort: { created: -1, executed: 1 } }
    )
    return data || []
  } else if (!id) {
    const filter = { executed: false, executing: false, botname: bot }
    const data = await LineCMD.find(filter, null, { limit: 10 })
    return data || []
  } else {
    const updated = { updated: new Date() }
    const where = id !== 'clear' ? { _id: id } : { botname: bot }
    await LineCMD.updateMany(where, {
      $set: Object.assign(
        updated,
        Object.keys(req.body).length > 0
          ? req.body
          : { executed: true, executing: true }
      )
    })
    return { error: null }
  }
}
