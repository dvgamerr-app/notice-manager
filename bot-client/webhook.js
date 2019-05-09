const request = require('request-promise')

module.exports = (body) => {
  return request({
    method: 'POST',
    url: require('./ngrok'),
    body: body
  })
}