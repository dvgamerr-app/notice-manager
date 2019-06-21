const { WebClient } = require('@slack/web-api')

const token = process.env.SLACK_TOKEN
const web = new WebClient(token)

const getChannal = async room => {
  let obj = null
  for (const channel of (await web.channels.list()).channels) {
    if (channel.name === room) {
      obj = channel
      break
    }
  }
  if (!obj) throw new Error('channels is undefined.')
  return obj
}

module.exports = {
  slackMessage: async (room, name, sender = { text: 'hello world.'}) => {
    if (!room) return
    let channel = await getChannal(room)
    if (typeof sender === 'string') sender = { text: sender }
    
    await web.chat.postMessage(Object.assign({
      channel: channel.id,
      username: name
    }, sender))
  }
}
