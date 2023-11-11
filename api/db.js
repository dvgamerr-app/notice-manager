const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(process.env.SQLITE_PATH || './notice.db')

const dbGetAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (e, r) => {
    if (e) return reject(e)
    resolve(r)
  })
})
const dbGetOne = async (sql, params) => {
  const result = await dbGetAll(sql, params)
  if (result) { return result[0] } else { return null }
}

const dbRun = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, (e) => {
    if (e) return reject(e)
    resolve()
  })
})

module.exports = { db, dbGetAll, dbGetOne, dbRun }
