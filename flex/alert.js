const request = require('request-promise')
const moment = require('moment')
const url = require('./url-bot')

module.exports = async (msg, line, color = '#009688') => {
  let contents = [
    {
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', weight: 'bold', text: 'LINE-BOT', size: 'sm', color: color },
        { type: 'text', weight: 'bold', text: moment().add(7, 'hour').format('D MMM YYYY HH:mm:ss'), size: 'xxs', align: 'end', color: '#9E9E9E' }
      ]
    },
    
  ]
  if (line) {
    contents.push({ type: 'text', weight: 'bold', text: msg, size: 'xxs', color: '#607d8b' })
    contents.push({ type: 'separator', margin: 'sm' })
    contents.push({ type: 'text', margin: 'md', text: line, wrap: true, size: 'xxs', color: '#9e9e9e' })
  } else {
    contents.push({ type: 'separator', margin: 'sm' })
    contents.push({ type: 'text', margin: 'md', weight: 'bold', text: msg, wrap: true, size: 'xxs', color: '#607d8b' })
  }
  let body = {
    type: 'flex',
    altText: `LINE-BOT ${msg}`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F8F8F8' } },
      body: { type: 'box', layout: 'vertical', contents: contents }
    }
  }
  return request({ method: 'PUT', url, body, json: true })
}
