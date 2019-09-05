import VuexORM from '@vuex-orm/core'
import Notify from '../model/notify'
import Api from '../model/api'

// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(Notify)
database.register(Api)

// Create Vuex Store and register database through Vuex ORM.
export const plugins = [
  VuexORM.install(database)
]
