export default {
  type: 'flex',
  altText: 'LINE-Notice Help command lists.',
  contents: {
    type: 'carousel',
    contents: [
      {
        type: 'bubble',
        header: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: 'BOT [RIS-Robo]', weight: 'bold', color: '#000000', size: 'xl' },
            { type: 'text', text: 'public bot allow all server.', color: '#CCCCCC', size: 'xs' }
          ]
        },
        hero: { type: 'image', size: 'full', aspectRatio: '1:1', aspectMode: 'cover', url: 'https://qr-official.line.me/M/O6-3eoWoC6.png' },
        body: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: 'Supported', weight: 'bold', color: '#4caf50', size: 'sm' },
            { type: 'box', margin: 'sm', layout: 'horizontal', contents: [
              { type: 'text', text: 'LINE BOT', weight: 'bold', size: 'xxs', flex: 1 },
              { type: 'text', text: 'custom bot and push 500 limit', size: 'xxs', color: '#aaaaaa', flex: 3 }
            ]}
          ]
        }
      },
      {
        type: 'bubble',
        header: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: 'COMMAND', weight: 'bold', color: '#000000', size: 'xl' },
            { type: 'text', text: 'bot command chat list.', color: '#CCCCCC', size: 'xs' }
          ]
        },
        body: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: 'COMMAND', weight: 'bold', color: '#ff5722', size: 'sm' },
            ...[ ['/api', 'get documentation request message.'], ['/id', 'get room name and check status.'], ['/room [name]', 'rename room from id to nickname'], ['/name [nickname]', 'rename user in room.'], ['/help', 'show this command list.'] ]
              .map(([cmd, desc]) => ({
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: cmd, weight: 'bold', size: 'xs', margin: 'sm' },
                  { type: 'text', text: desc, size: 'xs', color: '#aaaaaa', margin: 'xs' }
                ]
              }))
          ]
        }
      }
    ]
  }
}
