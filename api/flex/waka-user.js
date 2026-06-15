export default (user, stats, rank = 0) => ({
  type: 'flex',
  altText: `ยินดีต้อนรับครับ คุณ ${user.display_name}`,
  contents: {
    type: 'bubble', size: 'kilo',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '0px', cornerRadius: 'sm',
      contents: [{
        type: 'box', layout: 'horizontal', spacing: 'md', cornerRadius: 'sm',
        paddingTop: '10px', paddingBottom: '5px', paddingStart: '15px', paddingEnd: '15px',
        contents: [
          {
            type: 'box', layout: 'vertical', cornerRadius: '100px', width: '16px', height: '16px', offsetTop: '2px',
            contents: [{ type: 'image', url: user.photo, aspectMode: 'cover', size: 'full' }]
          },
          {
            type: 'box', layout: 'vertical',
            contents: [
              {
                type: 'text', size: 'sm', wrap: false,
                contents: [
                  { type: 'span', text: user.display_name, weight: 'bold', color: '#000000' },
                  { type: 'span', text: ' ' },
                  { type: 'span', text: `(@${user.username})`, size: 'xxs' }
                ]
              },
              {
                type: 'text', size: 'xs',
                contents: [
                  { type: 'span', text: `Rank #${rank} coded`, weight: 'bold' },
                  { type: 'span', text: ' ' },
                  { type: 'span', text: stats.human_readable_total }
                ]
              },
              {
                type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md',
                contents: [{ type: 'text', text: 'Power by wakatime.com', size: 'xxs', color: '#bcbcbc', align: 'end' }]
              }
            ]
          }
        ]
      }]
    },
    action: { type: 'uri', label: 'Show Profile', uri: `https://wakatime.com/@${user.username}` }
  }
})
