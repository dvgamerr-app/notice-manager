module.exports = [
  {
    id: 'LineCMD',
    name: 'db-line-cmd',
    schema: {
      service: { type: String, index: true },
      userId: { type: String, index: true },
      command: String,
      args: Array,
      text: String,
      event: Object,
      executing: { type: Boolean, index: true },
      executed: { type: Boolean, index: true },
      updated: Date,
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'LineCMDWebhook',
    name: 'db-line-cmd-webhook',
    schema: {
      service: { type: String, index: true },
      command: String,
      method: { type: String, default: 'POST' },
      url: String,
      active: { type: Boolean, index: true, default: true },
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'LineOutbound',
    name: 'db-line-outbound',
    schema: {
      service: { type: String, index: true },
      userTo: String,
      type: String,
      sender: Object,
      sended: Boolean,
      error: String,
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'LineInbound',
    name: 'db-line-inbound',
    schema: {
      type: String,
      service: { type: String, index: true },
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
    }
  },
  {
    id: 'LineBot',
    name: 'db-line-bot',
    schema: {
      userId: { type: String, index: true, default: null },
      service: { type: String, index: true },
      name: String,
      accesstoken: String,
      secret: String,
      options: Object,
      active: { type: Boolean, index: true, default: true },
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'LineBotRoom',
    name: 'db-line-bot-room',
    schema: {
      userId: { type: String, index: true, default: null },
      service: { type: String, index: true },
      name: String,
      type: String,
      variable: Object,
      active: { type: Boolean, index: true, default: true },
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'LineBotUser',
    name: 'db-line-bot-user',
    schema: {
      userId: { type: String, index: true },
      service: { type: String, index: true },
      room: { type: String, index: true },
      name: String,
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'ServiceBot',
    name: 'db-service',
    schema: {
      userId: { type: String, index: true },
      service: { type: String, index: true },
      name: String,
      client: String,
      secret: String,
      active: { type: Boolean, index: true, default: true },
      created: { type: Date, index: true, default: Date.now }
    }
  },
  {
    id: 'ServiceBotOauth',
    name: 'db-service-oauth',
    schema: {
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
    }
  },
  {
    id: 'ServiceWebhook',
    name: 'db-service-webhook',
    schema: {
      service: { type: String, index: true },
      room: { type: String, index: true },
      body: String
    }
  },
  {
    id: 'ChatWebhook',
    name: 'db-chat-webhook',
    schema: {
      type: { type: String, index: true },
      service: { type: String, index: true },
      name: String,
      uri: String,
      active: { type: Boolean, index: true, default: true },
      created: { type: Date, index: true, default: Date.now }
    }
  }
]
