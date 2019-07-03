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
  created: { type: Date, index: true, default: Date.now }
})
mongo.set('LineOutbound', 'db-line-outbound', {
  botname: { type: String, index: true },
  userTo: String,
  type: String,
  sender: Object,
  sended: Boolean,
  error: String,
  created: { type: Date, index: true, default: Date.now }
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
  created: { type: Date, index: true, default: Date.now }
})

mongo.set('LineBot', 'db-line-bot', {
  type: { type: String, index: true },
  botname: { type: String, index: true },
  name: String,
  accesstoken: String,
  secret: String,
  options: Object,
  active: { type: Boolean, index: true, default: true },
  created: { type: Date, index: true, default: Date.now }
})

mongo.set('ServiceBot', 'db-service-bot', {
  name: String,
  service: { type: String, index: true },
  client: String,
  secret: String,
  active: { type: Boolean, index: true, default: true },
  created: { type: Date, index: true, default: Date.now }
})

mongo.set('ServiceOauth', 'db-service-oauth', {
  service: { type: String, index: true },
  room: { type: String, index: true },
  name: String,
  state: { type: String, index: true },
  limit: {
    reset: Number,
    image: Number,
    remaining: Number
  },
  response_type: String,
  redirect_uri: String,
  accessToken: { type: Object, index: true, default: null },
  created: { type: Date, index: true, default: Date.now }
})

mongo.set('ServiceStats', 'db-service-stats', {
  name: { type: String, index: true },
  type: { type: String, index: true },
  desc: String,
  wan_ip: String,
  lan_ip: String,
  online: { type: Boolean, index: true, default: false },
  created: { type: Date, index: true, default: Date.now }
})

module.exports = mongo
