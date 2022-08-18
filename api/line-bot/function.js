// const Boom = require('@hapi/boom')
const { notice } = require('@touno-io/db/schema')
const axios = require('axios')

const sdkClient = require('../sdk-client')
const wakaRank = require('../flex/waka-rank')

const wakaApi = 'https://wakatime.com/api/v1'

module.exports = async (req, h) => {
  try {
    const { bot, room } = req.params
    const { LineBotRoom, LineBotUser } = notice.get()
    const { pushMessage } = await sdkClient(bot)

    const botRoom = await LineBotRoom.findOne({
      _id: '607a6a21209b8a40682f68a8'
    })
    if (!botRoom || !botRoom.variable) {
      return { OK: false }
    }

    if (req.method === 'get') {
      return botRoom.variable
        .map(({ userId, rank, data }) => {
          return Object.assign({ userId, rank }, data.wakaUser, {
            stats: data.wakaStats
          })
        })
        .sort((a, b) => (a.rank > b.rank ? 1 : -1))
    } else if (req.method === 'patch' || req.method === 'put') {
      const flex = []
      const waka = []
      for (let i = 0; i < botRoom.variable.length; i++) {
        const row = botRoom.variable[i]

        const { data: user } = await axios(
          `${wakaApi}/users/current?api_key=${row.data.wakaKey}`
        )
        const { data: stats } = await axios(
          `${wakaApi}/users/current/stats/last_7_days?api_key=${row.data.wakaKey}`
        )
        const languages = stats.data.languages.map(l => l.name).join()

        await LineBotUser.updateMany({
          botname: bot,
          roomname: room,
          userId: row.userId
        })
        new LineBotUser({
          botname: bot,
          roomname: room,
          userId: row.userId,
          name: user.display_name
        }).save()

        row.data = Object.assign(row.data, {
          lasted: new Date(),
          languages,
          wakaStats: stats.data,
          wakaUser: user.data
        })
        flex.push({ user: user.data, stats: stats.data })
      }

      botRoom.variable = botRoom.variable.sort((a, b) =>
        a.data.wakaStats.total_seconds <= b.data.wakaStats.total_seconds
          ? 1
          : -1
      )
      for (let i = 0; i < botRoom.variable.length; i++) {
        const row = botRoom.variable[i]
        if (row.rank !== i + 1) {
          // eslint-disable-next-line no-console
          console.log(
            `${row.data.wakaUser.display_name} - Rank: ${row.rank} >> ${
              i + 1
            } (${row.data.wakaStats.human_readable_total})`
          )
          waka.push({
            user: row.data.wakaUser,
            stats: row.data.wakaStats,
            old_rank: row.rank,
            new_rank: i + 1
          })
        }
        row.rank = i + 1
      }

      await LineBotRoom.updateOne(
        { _id: botRoom._id },
        { $set: { variable: botRoom.variable } }
      )

      if (req.method === 'put') {
        const jsonFlex = wakaRank(null, flex)
        await pushMessage(botRoom.id, jsonFlex)
      }
    }
  } catch (ex) {
    throw ex.message
  }
  return { OK: true }
}
