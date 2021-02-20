import VuexORM from '@vuex-orm/core'
import Api from '../model/api'
import Notify from '../model/notify'
import Bot from '../model/bot'
import Webhook from '../model/webhook'

// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(Api)
database.register(Notify)
database.register(Bot)
database.register(Webhook)

// Create Vuex Store and register database through Vuex ORM.
export const plugins = [
  VuexORM.install(database)
]

export const state = () => ({
  wait: false,
  full: true,
  tall: false,
  compact: false,
  profile: {
    userId: null,
    displayName: null,
    pictureUrl: '',
    statusMessage: null
  }
})

export const mutations = {
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
