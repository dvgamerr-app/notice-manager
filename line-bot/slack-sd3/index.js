module.exports = {
  party: 'slack',
  hooks: 'https://hooks.slack.com/services/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',
  commands: {
    'exec': async () => {
    
    },
    'profile': async () => {

    },
    'help': async () => {
      return [
        '`/help` ดูคำสั่งที่มีทั้งหมด',
        '`/exec` [function_name] ถ้าไม่ระบุจะเป็นเรียก func ทั้งหมดขึ้นมา',
        '`/profile` ดูข้อมูลของ chat'
      ].join('\\n')
    }
  }
}
