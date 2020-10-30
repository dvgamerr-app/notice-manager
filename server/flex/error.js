const axios = require('axios')
const url = require('./url-bot')

module.exports = (app, ex, flex = false) => {
  const data = {
    type: 'flex',
    altText: `พบข้อผิดพลาด [${app}] ${ex.message}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'filler' }],
        spacing: 'md',
        backgroundColor: '#f44336',
        cornerRadius: 'none',
        paddingAll: '0px',
        height: '4px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'ข้อผิดพลาดภายใน', size: 'xxs', color: '#f44336cc' },
          { type: 'text', text: ex.message, color: '#f44336', size: 'lg', flex: 4, weight: 'bold' },
          { type: 'separator', margin: 'sm' },
          { type: 'text', weight: 'regular', text: ex.stack, size: 'xxs', color: '#666666', decoration: 'none', style: 'normal', gravity: 'top', wrap: true, margin: 'md' }
        ],
        paddingAll: '5px',
        paddingStart: '10px',
        cornerRadius: 'none'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'filler' }],
        cornerRadius: 'none',
        height: '2px',
        paddingAll: '0px',
        backgroundColor: '#f44336'
      }
    }
  }
  return !flex ? axios({ method: 'PUT', url, data, json: true }) : data
}
