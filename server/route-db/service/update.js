import mongo from '../../mongodb'
import { slackMessage, pkgName, pkgChannel } from '../../helper'

export default async (req, res) => {
  let data = req.body
  let { ServiceBot, ServiceOauth } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    let id = data._id
    delete data._id
    if (data.accessToken == null) {
      let obj = await ServiceOauth.findOne({ _id: id })
      await slackMessage(pkgChannel, pkgName, `Notify *${obj.service}* inactive room *${obj.room}*.`)
    }
    await ServiceBot.updateOne({ _id: id }, data)
    res.json({})
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
