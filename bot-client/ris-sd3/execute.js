const request = require('../webhook')

module.exports = async (args, event) => {
  console.log('exec --- args', args, event)
  if (args[0] === 'run') {
    switch (args[1]) {
      case 'task':
        await request({ url: 'http://s-thcw-posdb95.pos.cmg.co.th/api/monitor/run-task/', method: 'POST', body: event })
        return `Copy that!, and is ordering the system.`
      default: return `Sir, Unknow job name is '${args[1]}'.`
    }
  }
}
