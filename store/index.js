import VuexORM from '@vuex-orm/core'
import User from '../model/user'
import Post from '../model/post'


// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(User)
database.register(Post)

// Create Vuex Store and register database through Vuex ORM.
export const plugins = [
  VuexORM.install(database)
]
