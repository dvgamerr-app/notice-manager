const adminId = 'U9e0a870c01ca97da20a4ec462bf72991'

module.exports = {
  channelAccessToken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c0e4547f7379cbb385259ac33d89911c',
  onEvents: {
    'join': async (event, client) => {
      let { userId, groupId } = event.source
      return `กลุ่มนี้ใครคุมวะ \`${groupId}\``
    },
    'leave': async (event, client) => {
      await client.pushMessage(adminId, JSON.stringify(event))
    }
  },
  onPostBack: {
    'saveDateTime': async (event, client) => {

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
      return [
        '`/help` ดูคำสั่งที่มีทั้งหมด',
        '`/exec` [function_name] ถ้าไม่ระบุจะเป็นเรียก func ทั้งหมดขึ้นมา',
        '`/profile` ดูข้อมูลของ chat'
      ].join('\n')
    }
  }
}
