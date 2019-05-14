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
            text: 'BOT [RIS-SD4]',
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
        url: 'https://qr-official.line.me/sid/M/621gbcwz.png'
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
                text: '/help',
                weight: 'bold',
                size: 'xs',
                flex: 1
              },
              {
                type: 'text',
                text: 'show QR and command can use.',
                size: 'xs',
                color: '#aaaaaa',
                margin: 'sm',
                flex: 4
              }
            ]
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
