const mongo = require('../mongodb')

mongo.set('LineCMD', 'db-line-cmd', {
  botname: String,
  userId: String,
  command: String,
  args: Array,
  text: String,
  event: Object,
  executing: Boolean,
  executed: Boolean,
  updated: Date,
  created: Date,
})
mongo.set('LineOutbound', 'db-line-outbound', {
  botname: String,
  userTo: String,
  type: String,
  sender: Object,
  sended: Boolean,
  error: String,
  created: Date,
})

mongo.set('LineInbound', 'db-line-inbound', {
  type: String,
  replyToken: String,
  source: Object,
  message: Object,
  joined: Object,
  left: Object,
  postback: Object,
  things: Object,
  beacon: Object,
  timestamp: Number,
  created: Date,
})

mongo.set('LineBot', 'db-line-bot', {
  type: String,
  botname: String,
  name: String,
  accesstoken: String,
  secret: String,
  options: Object,
  channel: mongo.Schema.Mixed,
  created: Date,
})

module.exports = {
  'ris-sd3': require('./ris-sd3'),
  'ris-sd4': require('./ris-sd4'),
  'slack-sd3': require('./slack-sd3'),
  'cmgpos-bot': require('./cmgpos-bot'),
  'gamgoum': require('./gamgoum')
}
