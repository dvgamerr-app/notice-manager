const numeral = require('numeral')

module.exports = (app, data) => {
  data = data.map(e => {
    return {
      short: false,
      title: `${e.name}${e.stats.limited ? ` (limit ${e.stats.limited})` : ''}`,
      value: `yesterday usage ${numeral(e.stats.reply + e.stats.push).format('0,0')} (monthly ${numeral(e.stats.usage).format('0,0')}) `
    }
  })
  let blocks = [
    { fallback: `${app} stats usage daily.`, pretext: `${app} stats usage daily.`, color: '#363636', fields: data }
  ]
  
  return { blocks }
}
// 