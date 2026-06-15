export default async (req, reply) => {
  const { access_token } = req.body || {}
  if (!access_token) return reply.status(400).send({ error: 'access_token required' })
  return { token: access_token }
}
