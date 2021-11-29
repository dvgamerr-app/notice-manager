const axios = require('axios')
const apiTelegram = 'https://api.telegram.org'

const instance = axios.create({
  validateStatus: () => true
})

const sendMessage = async (botToken, chatId, sender) => {
  if (!sender?.message) { throw new Error('message text is empty') }
  const { data } = await instance({
    method: 'POST',
    url: `${apiTelegram}/bot${botToken}/sendMessage?chat_id=${chatId}`,
    data: { parse_mode: 'Markdown', disable_web_page_preview: true, allow_sending_without_reply: true, text: sender.message },
    json: true
  })
  return data
}

module.exports = {
  sendMessage
}
