const mongo = require('../mongodb')

mongo.set('LineCMD', 'db-line-cmd', {
  botname: { type: String, index: true },
  userId: { type: String, index: true },
  command: String,
  args: Array,
  text: String,
  event: Object,
  executing: { type: Boolean, index: true },
  executed: { type: Boolean, index: true },
  updated: Date,
  created: { type: Date, index: true },
})
mongo.set('LineOutbound', 'db-line-outbound', {
  botname: { type: String, index: true },
  userTo: String,
  type: String,
  sender: Object,
  sended: Boolean,
  error: String,
  created: { type: Date, index: true },
})

mongo.set('LineInbound', 'db-line-inbound', {
  type: String,
  botname: { type: String, index: true },
  replyToken: String,
  source: Object,
  message: Object,
  joined: Object,
  left: Object,
  postback: Object,
  things: Object,
  beacon: Object,
  timestamp: { type: Number, index: true },
  created: { type: Date, index: true },
})

mongo.set('LineBot', 'db-line-bot', {
  type: { type: String, index: true },
  botname: { type: String, index: true },
  name: String,
  accesstoken: String,
  secret: String,
  options: Object,
  channel: mongo.Schema.Mixed,
  created: { type: Date, index: true },
})

module.exports = {
  'ris-sd3': require('./ris-sd3'),
  'ris-sd4': require('./ris-sd4'),
  'slack-sd3': require('./slack-sd3'),
  'cmgpos-bot': require('./cmgpos-bot'),
  'gamgoum': require('./gamgoum')
}
