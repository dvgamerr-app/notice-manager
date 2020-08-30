const { existsSync, readFileSync } = require('fs')
module.exports = n => (/^\/run\/secrets/.test(n) && existsSync(n)) ? readFileSync(n).toString() : process.env[n]
