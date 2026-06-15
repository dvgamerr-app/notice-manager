const synologyHost = process.env.SYNOLOGY_HOST || 'http://localhost:5000'

export default async (req, reply) => {
  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/, '')
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })

  const res = await fetch(`${synologyHost}/webman/sso/SSOAccessToken.cgi?access_token=${token}`)
  if (!res.ok) return reply.status(401).send({ error: 'Invalid token' })
  return res.json()
}
