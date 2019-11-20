import request from 'request-promise'

export const getStatus = async (accessToken) => request({
  method: 'GET',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  url: 'https://notify-api.line.me/api/status',
  resolveWithFullResponse: true,
  json: true
})

export const pushMessage = async (accessToken, message) => {
  if (typeof message === 'string') {
    message = { message }
  }
  return request({
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    url: 'https://notify-api.line.me/api/notify',
    formData: message,
    resolveWithFullResponse: true,
    json: true
  })
}

export const setRevoke = async (accessToken) => request({
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  url: 'https://notify-api.line.me/api/revoke',
  resolveWithFullResponse: true,
  json: true
})