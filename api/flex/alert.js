const fmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  timeZone: 'Asia/Bangkok'
})

export default (title, msg, detail, color = '#009688') => {
  const contents = []
  if (/\n/.test(msg)) {
    const [h1, h2] = msg.split(/\n/)
    contents.push({ type: 'text', weight: 'bold', text: h1, size: 'xs', color: '#666666', gravity: 'top', offsetTop: '2px' })
    contents.push({ type: 'text', text: h2, size: 'xxs', color: '#666666', gravity: 'top', wrap: true })
    msg = h1
  } else {
    contents.push({ type: 'text', text: msg, size: 'xxs', color: '#666666', gravity: 'top', wrap: true })
  }
  if (detail) {
    contents.push({ type: 'separator', margin: 'sm' })
    contents.push({ type: 'text', text: detail, size: 'xxs', color: '#939393', gravity: 'top', wrap: true, margin: 'sm' })
  }

  return {
    type: 'flex',
    altText: `แจ้งเตือน ${msg}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: color,
        paddingTop: '5px', paddingStart: '10px', paddingEnd: '10px', paddingBottom: '5px',
        contents: [
          {
            type: 'box', layout: 'vertical',
            contents: [
              { type: 'text', text: 'แจ้งเตือน', color: '#ffffff66', size: 'xxs' },
              { type: 'text', text: title, color: '#ffffff', size: 'md', weight: 'bold' }
            ]
          },
          {
            type: 'box', layout: 'vertical', position: 'absolute', offsetEnd: '10px', offsetTop: '15px',
            contents: [{ type: 'text', text: fmt.format(new Date()), size: 'xxs', align: 'end', color: '#ffffff99' }]
          }
        ]
      },
      body: { type: 'box', layout: 'vertical', paddingAll: '5px', paddingStart: '10px', contents }
    }
  }
}
