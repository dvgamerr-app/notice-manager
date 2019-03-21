module.exports = {
  channelAccessToken: 'Mv6ULaO86WfeFE3KrueZmazOiwFFwYJiEUYn+RQt6oFc313g8KFSYrx+Z7+odTH3qqvCp5hjl75n9XYtmDg35A4BD/EQIMYoVhMvdtRy0aXUmQ62KMp6KEu8XbChgo9bQ/G4hsnsJCF+4OWH6K1EuwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c0e4547f7379cbb385259ac33d89911c',
  onEvents: {
    'join': async (event, client) => {
      
    },
    'leave': async (event, client) => {
      
    }
  },
  onCommands: {
    'exec': require('./execute'),
    'profile': async (args, client) => {
      let sender =  { type: 'text', text: '' }
      let { userId, type, groupId, roomId } = this.source
      if (type === 'room') {
        sender.text = `*RoomId:* \`${roomId}\``
        await client.replyMessage(this.replyToken, sender)
      } else if (type === 'group') {
        sender.text = `*GroupId:* \`${groupId}\``
        await client.replyMessage(this.replyToken, sender)
      } else {
        let profile = await client.getProfile(userId)
        sender.text = `*${profile.displayName}* - ${profile.statusMessage}\n\`${profile.userId}\`\n\`${profile.pictureUrl}\``
        await client.replyMessage(this.replyToken, sender)
      }
    },
    'help': async (args, client) => {
      return [
        '`/help` ดูคำสั่งที่มีทั้งหมด',
        '`/exec` [function_name] ถ้าไม่ระบุจะเป็นเรียก func ทั้งหมดขึ้นมา',
        '`/profile` ดูข้อมูลของ chat'
      ].join('\n')
    }
  }
}
