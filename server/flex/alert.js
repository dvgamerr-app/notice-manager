const request = require('request-promise')
const moment = require('moment')
const url = require('./url-bot')

module.exports = (title, msg, detail, color = '#009688', flex = false) => {
  const contents = []

  if (/\n/.test(msg)) {
    const [header1, header2] = msg.split(/\n/)
    contents.push({ type: 'text', weight: 'bold', text: header1, size: 'xs', color: '#666666', decoration: 'none', gravity: 'top', offsetTop: '2px' })
    contents.push({ type: 'text', weight: 'regular', text: header2, size: 'xxs', color: '#666666', decoration: 'none', style: 'normal', gravity: 'top', wrap: true })
    msg = header1
  } else {
    contents.push({ type: 'text', weight: 'regular', text: msg, size: 'xxs', color: '#666666', decoration: 'none', style: 'normal', gravity: 'top', wrap: true })
  }

  if (detail) {
    contents.push({ type: 'separator', margin: 'sm' })
    contents.push({ type: 'text', weight: 'regular', text: detail, size: 'xxs', color: '#939393', decoration: 'none', style: 'normal', gravity: 'top', wrap: true, margin: 'sm' })
  }

 moment().format('D MMM YYYY HH:mm:ss')
  const body = {
    type: 'flex',
    altText: `แจ้งเตือน ${msg}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: 'แจ้งเตือน', color: '#ffffff66', size: 'xxs' },
              { type: 'text', text: title, color: '#ffffff', size: 'md', flex: 4, weight: 'bold' }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            position: 'absolute',
            offsetEnd: '10px',
            offsetTop: '15px',
            contents: [
              { type: 'text', weight: 'bold', text: moment().format('D MMM YYYY HH:mm:ss'), size: 'xxs', align: 'end', color: '#ffffff99' }
            ]
          }
        ],
        spacing: 'md',
        paddingTop: '5px',
        paddingStart: '10px',
        paddingEnd: '10px',
        paddingBottom: '5px',
        cornerRadius: 'none',
        backgroundColor: color
      },
      body: { type: 'box', layout: 'vertical', paddingAll: '5px', paddingStart: '10px', cornerRadius: 'none', contents }
    }
  }
  return !flex ? request({ method: 'PUT', url, body, json: true }) : body
}
