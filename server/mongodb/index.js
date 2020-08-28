import getEnv from '../get-env'

const mongoose = require('mongoose')
// const fs = require('fs')

global._mongo = { connected: () => false }
let tmp = []
const { mConn, mMapping } = {
  mConn: async (server, dbname, username, password) => {
    const IsAdmin = !!getEnv('MONGODB_ADMIN')
    const MONGODB_ACCOUNT = getEnv('MONGODB_ADMIN') || username ? `${username}:${password}@` : ''
    const MONGODB_SERVER = server || getEnv('MONGODB_SERVER') || 'localhost:27017'

    let MONGODB_URI = getEnv('MONGODB_URI') || `mongodb://${MONGODB_ACCOUNT}${MONGODB_SERVER}/${dbname}?authMode=scram-sha1${IsAdmin ? '&authSource=admin' : ''}`
    global._mongo = await mongoose.createConnection(MONGODB_URI, {
      useCreateIndex: true,
      useNewUrlParser: true,
      connectTimeoutMS: 10000,
      // server: {
      //   ssl: true,
      //   sslValidate: true,
      //   sslCA: [ fs.readFileSync('C:/ProgramData/MongoDB/cert/ca.crt', 'utf8') ],
      //   sslCert: fs.readFileSync('C:/ProgramData/MongoDB/cert/client.crt', 'utf8'),
      //   sslKey: fs.readFileSync('C:/ProgramData/MongoDB/cert/client.key', 'utf8')
      // }
    })
    const ready = global._mongo.readyState
    if (ready !== 1) throw new Error(`MongoDB Connection, ${MONGODB_URI}/${dbname} (State is ${ready})`)

    global._mongo.connected = () => global._mongo.readyState === 1
  },
  mMapping: (table, force = false) => {
    if (!table.id) throw new Error(`mongodb id is undefined.`)
    if (typeof table.schema !== 'object') throw new Error(`mongodb schema is not object.`)
    if (!table.name) throw new Error(`mongodb name is undefined.`)
    if (global._mongo[table.id]) throw new Error(`MongoDB schema name is duplicate '${table.id}'`)
    if (global._mongo.connected() || force) {
      global._mongo[table.id] = global._mongo.model(table.name, mongoose.Schema(table.schema), table.name)
    } else {
      tmp.push(table)
    }
  }
}

module.exports = {
  Schema: {
    ObjectId: mongoose.Schema.ObjectId,
    Mixed: mongoose.Schema.Types.Mixed
  },
  connected: () => global._mongo.connected(),
  set: (name, dbname, schema) => {
    if (name instanceof Array) {
      for (const db of name) mMapping(db)
    } else if (name instanceof Object) {
      mMapping(name)
    } else if (typeof name === 'string') {
      mMapping({ id: name, name: dbname, schema })
    }
  },
  get: (name = '') => {
    return name ? global._mongo[name] : global._mongo
  },
  open: async () => {
    if (!global._mongo.connected()) {
      await mConn()
      for (const db of tmp) mMapping(db, true)
      tmp = null
    }
  }
}
