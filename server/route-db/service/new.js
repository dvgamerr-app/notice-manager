import mongo from '../../mongodb'

export default async (req, res) => {
  let data = req.body
  console.log(data)
  let { ServiceBot } = mongo.get() // LineInbound, LineOutbound, LineCMD, ServiceOauth
  try {
    if (await ServiceBot.findOne({ name: data.name })) throw new Error('name is duplicate.')

    await new ServiceBot({
      name: data.name,
      service: data.name,
      client: data.client_id,
      secret: data.client_secret
    }).save()
  } catch (ex) {
    res.json({ error: ex.message })
  }
  res.end()
}
