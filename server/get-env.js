const { existsSync, readFileSync } = require('fs')
export default (n) => (/^\/run\/secrets/.test(n) && existsSync(n)) ? readFileSync(n).toString() : process.env[n]
