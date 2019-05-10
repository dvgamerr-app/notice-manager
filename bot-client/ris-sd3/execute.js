const request = require('../webhook')

module.exports = async (args, event, client) => {
  let { userId } = event.source
  const pushMessage = async message => {
    await client.pushMessage(userId, { type: 'text', text: message })
  }

  if (args[0] === 'run') {
    switch (args[1]) {
      case 'task':
        await pushMessage(`Copy that!, and waiting approval...`)
        await request({ url: 'http://s-thcw-posdb95.pos.cmg.co.th/api/monitor/run-task/', method: 'POST', body: event })
        break
      default: return `Sir, Unknow job name is '${args[1]}'.`
    }
  }
}
