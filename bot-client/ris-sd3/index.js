const adminId = 'U9e0a870c01ca97da20a4ec462bf72991'
const helpFlex = require('./flex/help-command')

module.exports = {
  party: 'line',
  channelAccessToken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c0e4547f7379cbb385259ac33d89911c',
  webhook: 'http://s-thcw-posdb95.pos.cmg.co.th/api/monitor/run-task/',
  onEvents: {
    'join': async (event) => {
      let { groupId } = event.source
      return `กลุ่มนี้ใครคุมวะ \`${groupId}\``
    },
    'leave': async (event, client) => {
      await client.pushMessage(adminId, { type: 'text', text: `\`\`\`\n${JSON.stringify(event)}\n\`\`\`` })
    }
  },
  onPostBack: {
    // event, data, client
    'getItems': async (event, data) => {
      console.log('getItems:', data)
      return `randomId: ${data.id}`
    }
  },
  onCommands: {
    // args, event, client
    'exec': require('./execute'),
    'id': async (args, event) => {
      let { userId, type, groupId, roomId } = event.source
      if (type === 'room') {
        return roomId // `*RoomId:* \`${roomId}\``
      } else if (type === 'group') {
        return groupId // `*GroupId:* \`${groupId}\``
      } else {
        return userId
        // let profile = await client.getProfile(userId)
        // return `*${profile.displayName}* - ${profile.statusMessage}\n\`${profile.userId}\`\n\`${profile.pictureUrl}\``
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
