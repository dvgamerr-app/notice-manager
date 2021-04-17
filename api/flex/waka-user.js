module.exports = (user, stats, rank = 0) => {
  const data = {
    type: 'flex',
    altText: `ยินดีต้อนรับครับ คุณ ${user.display_name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [{ type: 'image', url: user.photo, aspectMode: 'cover', size: 'full' }],
                cornerRadius: '100px',
                width: '16px',
                height: '16px',
                offsetTop: '2px'
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    contents: [
                      { type: 'span', text: user.display_name, weight: 'bold', color: '#000000' },
                      { type: 'span', text: ' ' },
                      { type: 'span', text: `(@${user.username})`, size: 'xxs' }
                    ],
                    size: 'sm',
                    wrap: false
                  },
                  {
                    type: 'text',
                    contents: [
                      { type: 'span', text: `Rank #${rank} coded`, weight: 'bold' },
                      { type: 'span', text: ' ' },
                      { type: 'span', text: stats.human_readable_total }
                    ],
                    size: 'xs'
                  },
                  {
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      { type: 'text', text: 'power by wakatime.com', size: 'xxs', color: '#bcbcbc', align: 'end' }
                    ],
                    spacing: 'sm',
                    margin: 'sm'
                  }
                ]
              }
            ],
            spacing: 'md',
            cornerRadius: 'sm',
            paddingTop: '10px',
            paddingBottom: '5px',
            paddingStart: '15px',
            paddingEnd: '15px'
          }
        ],
        paddingAll: '0px',
        cornerRadius: 'sm'
      },
      action: {
        type: 'uri',
        label: 'Show Profile',
        uri: 'https://wakatime.com/@dvgamerr'
      }
    }
  }
  return data
}
