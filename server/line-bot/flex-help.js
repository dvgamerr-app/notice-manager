const flexMessage = {
  type: 'carousel',
  contents: [
    {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'BOT [RIS-Robo]',
            weight: 'bold',
            color: '#000000',
            size: 'xl'
          },
          {
            type: 'text',
            text: 'public bot allow all server.',
            color: '#CCCCCC',
            size: 'xs'
          }
        ]
      },
      hero: {
        type: 'image',
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover',
        url: 'https://qr-official.line.me/M/O6-3eoWoC6.png'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Supported',
            weight: 'bold',
            color: '#4caf50',
            size: 'sm'
          },
          {
            type: 'box',
            margin: 'sm',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'BOT Notify',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: 'add services from the app page.',
                size: 'xxs',
                color: '#aaaaaa',
                flex: 3
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'LINE BOT',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: 'custome bot and push 500 limit',
                size: 'xxs',
                color: '#aaaaaa',
                flex: 3
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'Slack',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: 'bot app Mii Slack in ris-dev.slack.com.',
                size: 'xxs',
                color: '#aaaaaa',
                flex: 3
              }
            ]
          }
        ]
      }
    },

    {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'COMMAND',
            weight: 'bold',
            color: '#000000',
            size: 'xl'
          },
          {
            type: 'text',
            text: 'ris-sd3 bot command chat list.',
            color: '#CCCCCC',
            size: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'COMMAND',
            weight: 'bold',
            color: '#ff5722',
            size: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '/api',
                weight: 'bold',
                size: 'xs',
                margin: 'sm'
              },
              {
                type: 'text',
                text: 'get documentation request message.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'xs'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '/id',
                weight: 'bold',
                size: 'xs',
                margin: 'sm'
              },
              {
                type: 'text',
                text: 'get room name and check status.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'xs'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '/room [name]',
                weight: 'bold',
                size: 'xs',
                margin: 'sm'
              },
              {
                type: 'text',
                text: 'rename room from id to nickname api',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'xs'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '/name [nickname]',
                weight: 'bold',
                size: 'xs',
                margin: 'sm'
              },
              {
                type: 'text',
                text: 'rename user in room.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'xs'
              }
            ]
          }
        ]
      }
    }
  ]
}

module.exports = {
  type: 'flex',
  altText: 'LINE-Notice Help command lists.',
  contents: flexMessage
}
