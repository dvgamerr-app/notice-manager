const numeral = require('numeral')

module.exports = (app, data) => {
  data = data.map(e => {
    return {
      type: `mrkdwn`,
      text: `*${e.name}* ${e.stats.limited ? ` (limit ${e.stats.limited})` : ''} *:*\nyesterday usage ${numeral(e.stats.reply + e.stats.push).format('0,0')} (monthly ${numeral(e.stats.usage).format('0,0')}) `
    }
  })
  
  let blocks = [
    { type: `section`, fields: data }
  ]
  return { pretext: `${app} stats usage daily.`, blocks }
}
// 