const synologyHost = process.env.SYNOLOGY_HOST || 'http://localhost:5000'
const synologyAppId = process.env.SYNOLOGY_APPID || ''
const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

export default (req, reply) => {
  const sso = new URLSearchParams({
    app_id: synologyAppId,
    scope: 'user_id',
    state: `notice-auth_${Math.floor(Math.random() * 99999)}`,
    redirect_uri: `${baseUrl}/auth/login`
  })
  return reply.redirect(`${synologyHost}/webman/sso/SSOOauth.cgi?${sso}`)
}
