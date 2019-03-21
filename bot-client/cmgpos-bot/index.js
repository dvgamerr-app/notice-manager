module.exports = {
  channelAccessToken: '88qo4WYryf4VXg5ZcGGVXmso3qqwb3gBvDBNbAfCEY95G5OVGX6ijgG5g09ydm23gwUeZoiZ36IWI//DwHLgTDE1Pdo39n0UVtpVOEpz48Xnqfzeu7uRAL5tLkRZJDqnID7p/IbMA+DKOBdkl+r/LAdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'a3ccb2a64a07a4f0274197a2a9665466',
  commands: {
    'exec': async (args, client) => {
    
    },
    'profile': async (args, client) => {

    },
    'help': async (args, client) => {
      return [
        '`/help` ดูคำสั่งที่มีทั้งหมด',
        '`/exec` [function_name] ถ้าไม่ระบุจะเป็นเรียก func ทั้งหมดขึ้นมา',
        '`/profile` ดูข้อมูลของ chat'
      ].join('\\n')
    }
  }
}
