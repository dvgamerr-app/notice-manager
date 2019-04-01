const adminId = 'U9e0a870c01ca97da20a4ec462bf72991'

module.exports = {
  party: 'line',
  channelAccessToken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c0e4547f7379cbb385259ac33d89911c',
  onEvents: {
    'join': async (event, client) => {
      let { userId, groupId } = event.source
      return `กลุ่มนี้ใครคุมวะ \`${groupId}\``
    },
    'leave': async (event, client) => {
      await client.pushMessage(adminId, { type: 'text', text: `\`\`\`\n${JSON.stringify(event)}\n\`\`\`` })
    }
  },
  onPostBack: {
    'getItems': async (event, data, client) => {
      console.log('getItems:', data)
      return `randomId: ${data.id}`
    }
  },
  onCommands: {
    'exec': require('./execute'),
    'profile': async (args, event, client) => {
      let { userId, type, groupId, roomId } = event.source
      if (type === 'room') {
        return `*RoomId:* \`${roomId}\``
      } else if (type === 'group') {
        return `*GroupId:* \`${groupId}\``
      } else {
        let profile = await client.getProfile(userId)
        return `*${profile.displayName}* - ${profile.statusMessage}\n\`${profile.userId}\`\n\`${profile.pictureUrl}\``
      }
    },
    'help': async (args, event, client) => {
      
      return {
        type: 'text',
        text: 'Replay Message.',
        quickReply: {
          items: [
            {
              type: 'action',
              imageUrl: 'https://cdn1.iconfinder.com/data/icons/mix-color-3/502/Untitled-1-512.png',
              action: {
                type: 'message',
                label: 'Profile',
                text: '/profile'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'Commands',
                data: 'func=getItems&id=' + parseInt(Math.random() * 10000),
                displayText: 'Get Items.'
              }
            }
          ]
        }
      }
    }
  }
}
