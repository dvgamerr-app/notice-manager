const request = require('request-promise')
const numeral = require('numeral')
const url = require('./url-bot')

module.exports = async (app, data) => {
  data = data.map(e => {
    return {
      type: 'box',
      layout: 'horizontal',
      contents: [
        { type: 'text', text: `${e.name}${e.stats.limited ? ` (${e.stats.limited})` : ''}`, color: '#363636', size: 'xxs' },
        { type: 'text', text: numeral(e.stats.reply + e.stats.push).format('0,0'), color: '#363636', align: 'end', size: 'xxs' },
        { type: 'text', text: numeral(e.stats.usage).format('0,0'), color: '#363636', align: 'end', size: 'xxs' }
      ]
    }
  })
  if (data.length > 0) {
    data[0].margin = 'sm'
    data[0].spacing = 'md'
  }
  let body = {
    type: 'flex',
    altText: `${app} stats usage`,
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
            margin: 'sm',
            spacing: 'md',
            contents: [
              { type: 'text', weight: 'bold', margin: 'sm', text: app, size: 'sm', color: '#009688', flex: 0 },
              { type: 'text', weight: 'bold', align: 'end', margin: 'xs', text: 'usage', size: 'sm', color: '#9E9E9E' }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            spacing: 'md',
            contents: [
              { type: 'text', text: 'Bot Name', color: '#607D8B', weight: 'bold', size: 'xxs' },
              { type: 'text', text: 'Yesterday', color: '#607D8B', weight: 'bold', align: 'end', size: 'xxs' },
              { type: 'text', text: 'Monthly', color: '#607D8B', align: 'end', weight: 'bold', size: 'xxs' }
            ]
          },
          { type: 'separator' },
          ...data
        ]
      }
    }
  }
  
  return request({ method: 'PUT', url, body, json: true })
}
