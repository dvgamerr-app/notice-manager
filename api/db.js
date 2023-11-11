const sqlite3 = require('sqlite3').verbose()
module.exports = new sqlite3.Database(process.env.SQLITE_PATH || './notice.db')
