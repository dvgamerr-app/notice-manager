const request = require('../webhook')

module.exports = async (args, event, client) => {
  if (args[0] === 'run' && args[1] === 'task') {
    request({
      url: 'http://s-thcw-posdb95.pos.cmg.co.th/api/monitor/run-task/',
      method: 'POST',
      body: event
    })
    return `request... --- api/monitor/run-task/`
  }
}
