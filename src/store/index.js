// import VuexORM, { Database } from '@vuex-orm/core'

// import Api from '../model/api'
// import Notify from '../model/notify'
// import NotiRoom from '../model/notiRoom'
// import Bot from '../model/bot'
// import BotRoom from '../model/botRoom'
// import Webhook from '../model/webhook'

// // Create a new database instance.
// const database = new Database()

// // Register Models to the database.
// database.register(Api)
// database.register(Notify)
// database.register(NotiRoom)
// database.register(Bot)
// database.register(BotRoom)
// database.register(Webhook)

// // Create Vuex Store and register database through Vuex ORM.
// export const plugins = [
//   // eslint-disable-next-line import/no-named-as-default-member
//   VuexORM.install(database)
// ]

export const state = () => ({
  wait: false,
  full: true,
  tall: false,
  compact: false,
  lineBot: [],
  lineNotify: [],
  profile: {
    userId: null,
    displayName: null,
    pictureUrl: '',
    statusMessage: null
  }
})

export const mutations = {
  lineBot (state, value) {
    if (value instanceof Array) {
      state.lineBot = value
    } else {
      state.lineBot.push(value)
    }
  },
  lineNotify (state, value) {
    if (value instanceof Array) {
      state.lineNotify = value
    } else {
      state.lineNotify.push(value)
    }
  },
  profile (state, value) {
    state.profile = value
  },
  toggleWait (state, value) {
    state.wait = value || !state.wait
  },
  setTall (state, value) {
    state.full = false
    state.tall = true
    state.compact = false
  },
  setFull (state, value) {
    state.full = true
    state.tall = false
    state.compact = false
  }
}
