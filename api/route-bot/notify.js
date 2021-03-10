const { nullFormat } = require('numeral')
const { notice } = require('@touno-io/db/schema')
const sdkNotify = require('../sdk-notify')

const packageSticker = {
  1: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 100, 101,
    102, 103, 104, 105, 106, 107, 108, 109, 110, 111
  ],
  11537: [
    52002734, 52002735, 52002736, 52002737, 52002738, 52002739, 52002740, 52002741, 52002742, 52002743,
    52002744, 52002745, 52002746, 52002747, 52002748, 52002749, 52002750, 52002751, 52002752, 52002753,
    52002754, 52002755, 52002756, 52002757, 52002758, 52002759, 52002760, 52002761, 52002762, 52002763,
    52002764, 52002765, 52002766, 52002767, 52002768, 52002769, 52002770, 52002771, 52002772, 52002773
  ]
}

module.exports = async (req, res) => {
  const IsWebhook = req.method === 'POST'
  const { room, service } = req.params
  const { sticker, imageThumbnail, imageFullsize, notificationDisabled, imageFile } = req.payload
  let { message, stickerPackageId, stickerId } = req.payload
  let outbound = nullFormat

  const { LineOutbound, ServiceWebhook } = notice.get()
  if (!message && !imageThumbnail && !imageFullsize && !stickerPackageId && !stickerId) { throw new TypeError('message is undefined.') }

  outbound = await new LineOutbound({ botname: service, userTo: room, type: 'notify', sender: req.payload || {} }).save()

  const { pushNotify } = await sdkNotify(service, room)
  if (!IsWebhook) {
    if (message) { message = message.replace(/\\n|newline/ig, '\n') }
    if (sticker) {
      stickerPackageId = 1
      stickerId = packageSticker[stickerPackageId][parseInt(Math.random() * 30)]
    }
  } else {
    const payload = await ServiceWebhook.findOne({ service, room })
    if (payload) {
      try {
        // eslint-disable-next-line no-unused-vars
        const { body } = req
        // eslint-disable-next-line no-eval
        message = eval('`' + payload.body + '`')
      } catch (ex) {
        message = `eval \`fail\`\n${process.env.HOST_API}/webhook/${outbound._id}`
      }
    } else {
      message = `*Webhook Payload*\n${process.env.HOST_API}/webhook/${outbound._id}`
    }
  }

  const { headers, data } = await pushNotify({ message, imageThumbnail, imageFullsize, stickerPackageId, stickerId, imageFile, notificationDisabled })

  const ratelimit = {
    remaining: parseInt(headers['x-ratelimit-remaining']),
    image: parseInt(headers['x-ratelimit-imageremaining']),
    reset: parseInt(headers['x-ratelimit-reset']) * 1000
  }
  // await ServiceBotOauth.updateOne({ room, service }, { $set: { limit: result } })
  if (data.status === 200) {
    await LineOutbound.updateOne({ _id: outbound._id }, { $set: { sended: true } })
  }
  return Object.assign(data, { ratelimit })
}
