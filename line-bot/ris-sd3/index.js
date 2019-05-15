const adminId = 'U9e0a870c01ca97da20a4ec462bf72991'
const helpFlex = require('./flex/help-command')

module.exports = {
  onEvents: {
    'join': async (event) => {
      let { groupId } = event.source
      return `กลุ่มนี้ใครคุมวะ \`${groupId}\``
    },
    'leave': async (event, client) => {
      await client.pushMessage(adminId, { type: 'text', text: `\`\`\`\n${JSON.stringify(event)}\n\`\`\`` })
    }
  },
  onCommands: {
    // args, event, client
    'id': async (args, event) => {
      let { userId, type, groupId, roomId } = event.source
      if (type === 'room') {
        return roomId
      } else if (type === 'group') {
        return groupId
      } else {
        return userId
      }
    },
    'help': async (args, event) => {
      if (event.source.type === 'user') return helpFlex
    },
    'menu': async () => {
      return {
        type: 'text',
        text: 'Tap on your menu item.',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: 'profile',
                text: '/id'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'execute',
                data: 'func=getItems&id=' + parseInt(Math.random() * 10000),
                displayText: 'call `GetItems` fucntion.'
              }
            }
          ]
        }
      }
    }
  }
}
