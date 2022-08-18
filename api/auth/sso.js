const synologyHost = process.env.SYNOLOGY_HOST || 'http://localhost:5000'
const synologyAppId = process.env.SYNOLOGY_APPID || 'xxxxxxxxxxxxxxxxx'

module.exports = (req, h) => {
  const sso = new URLSearchParams({
    app_id: synologyAppId,
    scope: 'user_id',
    state: `notice-auth_${parseInt(Math.random() * 99999)}`,
    redirect_uri: `${process.env.HOST_API}/auth`
  })
  return h.redirect(`${synologyHost}/webman/sso/SSOOauth.cgi?${sso}`)
}
