module.exports = {
  channelAccessToken: 'e1JsRE7Ol7LhD653EiBtBmSXV3Eq98gC81kbBN72JnKYCKk7isQ0kQYhyuMUkIhIB9ScVp23/qoypZOgKZWc6ydIHveHpqAFJ7GuS8de7s9zdZY3ty7jU5bYsdPl1cCgYqx7BpL5+pmJX6M4RI7/IwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'b35c00ad80890af2dee37ed87c5f1c3b',
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
