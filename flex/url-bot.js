const port = process.env.PORT || 4000
const botname = 'health-check'
const room = 'C31ca657c0955d89dcb049d63bfc32408'

module.exports = `http://127.0.0.1:${port}/${botname}/${room}`
