const request = require('request-promise')
const moment = require('moment')
const url = require('./url-bot')
const img = 'http://notice.touno.io/static/transparent.png'
module.exports = async (app, ex, flex = false) => {
  let body = {
    type: 'flex',
    altText: `ERROR :: [${app}] ${ex.message}`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F8F8F8' }, hero: { backgroundColor: '#ee5151' } },
      hero: { type: 'image', url: img, size: 'full', aspectRatio: '250:6', aspectMode: 'cover' },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'text', weight: 'bold', text: app, size: 'sm', color: '#f44336', margin: 'sm', flex: 0 },
              { type: 'text', weight: 'bold', text: moment().format('HH:mm:ss'), size: 'xxs', align: 'end', color: '#9E9E9E' }
            ]
          },
          { type: 'separator', margin: 'sm' },
          { type: 'text', margin: 'md', weight: 'bold', text: ex.message, wrap: true, size: 'xs', color: '#737373' },
          { type: 'text', text: ex.stack, wrap: true, size: 'xxs', color: '#c3c3c3' }
        ]
      }
    }
  }
  return !flex ? request({ method: 'PUT', url, body, json: true }) : body
}
