const request = require('request-promise')
const moment = require('moment')

module.exports = async (url, msg, color = '#f44336') => {
  let body = {
    type: 'flex',
    altText: `LINE-BOT ${msg}`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F8F8F8' } },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', weight: 'bold', text: 'LINE-BOT', size: 'sm', color: color },
              { type: 'text', weight: 'bold', text: moment().add(7, 'hour').format('HH:mm:ss'), size: 'xxs', align: 'end', color: '#9E9E9E' }
            ]
          },
          { type: 'separator', margin: 'sm' },
          { type: 'text', margin: 'md', weight: 'bold', text: msg, wrap: true, size: 'xxs', color: '#607d8b' }
        ]
      }
    }
  }
  return request({ method: 'PUT', url, body, json: true })
}
