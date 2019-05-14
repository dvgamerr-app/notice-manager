let flexMessage = {
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
            text: 'BOT [RIS-SD3]',
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
            text: 'BOT OTHER',
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
                text: 'กำกวม',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: '(private) bot for ris-sd3 group.',
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
                text: 'cmgpos',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: '(private) cmgpos-bot in cmgpos-group.',
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
                text: 'slack-sd3',
                weight: 'bold',
                size: 'xxs',
                flex: 1
              },
              {
                type: 'text',
                text: 'bot in slack api in ris-sd3.slack.com.',
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
            margin: 'sm',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '/id',
                weight: 'bold',
                size: 'xs',
                flex: 1
              },
              {
                type: 'text',
                text: 'get id currnt chat.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'sm',
                flex: 4
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '/menu',
                weight: 'bold',
                size: 'xs',
                flex: 1
              },
              {
                type: 'text',
                text: 'get mobile tap menu list.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'sm',
                flex: 4
              }
            ]
          },
          {
            type: 'text',
            text: 'MENU',
            margin: 'xl',
            weight: 'bold',
            color: '#ff5722',
            size: 'sm'
          },
          {
            type: 'box',
            margin: 'sm',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'profile',
                weight: 'bold',
                size: 'xs',
                flex: 1
              },
              {
                type: 'text',
                text: 'push /id to chat.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'sm',
                flex: 4
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'execute',
                weight: 'bold',
                size: 'xs',
                flex: 1
              },
              {
                type: 'text',
                text: 'execute getItem fucntion.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'sm',
                flex: 4
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
            text: 'Example',
            weight: 'bold',
            color: '#000000',
            size: 'xl'
          },
          {
            type: 'text',
            text: 'api and endpoint router for line bot.',
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
            text: 'PUSH MESSAGE',
            weight: 'bold',
            color: '#ff5722',
            size: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'PUT',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: '/ris-sd3/[userId]',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'Host:',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: 's-thcw-posweb01.pos.cmg.co.th:3000',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'Content-Type:',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: 'application/json',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '{ type: \'text\', text: \'bot sample message.\' }',
                size: 'xxs'
              }
            ]
          },
          {
            type: 'text',
            text: 'WEBHOOK',
            weight: 'bold',
            color: '#ff5722',
            margin: 'xl',
            size: 'sm'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'POST',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: '/',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'Host:',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: 's-thcw-posweb01.pos.cmg.co.th:3001',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'Content-Type:',
                weight: 'bold',
                size: 'xxs',
                flex: 0
              },
              {
                type: 'text',
                text: 'application/json',
                size: 'xxs',
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '{ url: \'...\', method: \'POST\', body: { success: true } }',
                size: 'xxs'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'uri',
              label: 'Web BOT-API',
              uri: 'http://s-thcw-posweb01.pos.cmg.co.th:3000/'
            }
          }
        ]
      }
    }
  ]
}

module.exports = {
  type: 'flex',
  altText: `Help command lists and sample data api.`,
  contents: flexMessage
}
