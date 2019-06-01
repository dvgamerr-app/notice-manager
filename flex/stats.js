const request = require('request-promise')
const url = require('./url-bot')

module.exports = async (data) => {
  data = data.map(e => {
    return {
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      spacing: 'md',
      contents: [
        { type: 'text', text: `${e.name}${e.stats.limited ? ' (limit)' : ''}`, color: '#363636', size: 'xxs' },
        { type: 'text', text: String(e.stats.reply + e.stats.push), color: '#363636', align: 'end', size: 'xxs' },
        { type: 'text', text: String(e.stats.usage), color: '#363636', align: 'end', size: 'xxs' }
      ]
    }
  })

  let body = {
    type: 'flex',
    altText: `LINE-BOT yesterday usage.`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F7F7F7' } },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', weight: 'bold', margin: 'sm', text: 'LINE-BOT usage daily', size: 'sm', color: '#333333' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            spacing: 'md',
            contents: [
              { type: 'text', text: 'Bot Name', color: '#363636', weight: 'bold', size: 'xs' },
              { type: 'text', text: 'Yesterday', color: '#363636', weight: 'bold', align: 'end', size: 'xs' },
              { type: 'text', text: 'Monthly', color: '#363636', align: 'end', weight: 'bold', size: 'xs' }
            ]
          },
          {
            type: 'separator'
          },
          ...data
        ]
      }
    }
  }
  
  return request({ method: 'PUT', url, body, json: true })
}
