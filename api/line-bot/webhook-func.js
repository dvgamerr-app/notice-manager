const { notice } = require('@touno-io/db/schema')
const axios = require('axios')

const sdkClient = require('../sdk-client')
const wakaRank = require('../flex/waka-rank')

const wakaApi = 'https://wakatime.com/api/v1'

module.exports = async (req, h) => {
  const { botname, roomname } = req.params
  const { LineBotRoom, LineBotUser } = notice.get()
  const { pushMessage } = await sdkClient(botname)

  const room = await LineBotRoom.findOne({ _id: '607a6a21209b8a40682f68a8' })
  if (!room || !room.variable) { return { OK: false } }
  const flex = []
  for (const row of room.variable) {
    const { data: user } = await axios(`${wakaApi}/users/current?api_key=${row.data.wakaKey}`)
    const { data: stats } = await axios(`${wakaApi}/users/current/stats/last_7_days?api_key=${row.data.wakaKey}`)
    const languages = stats.data.languages.map(l => l.name).join()

    await LineBotUser.updateMany({ botname, roomname, userId: row.userId })
    new LineBotUser({ botname, roomname, userId: row.userId, name: user.display_name }).save()

    row.data = Object.assign(row.data, { lasted: new Date(), languages, wakaStats: stats.data, wakaUser: user.data })
    flex.push({ user: user.data, stats: stats.data })
  }
  await LineBotRoom.updateOne({ _id: room._id }, { $set: { variable: room.variable } })
  const jsonFlex = wakaRank(null, flex)
  // console.log(JSON.stringify(jsonFlex))
  await pushMessage(room.id, jsonFlex)
  return { OK: true }
}
