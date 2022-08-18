const { notice } = require('@touno-io/db/schema')

module.exports = async (req, reply) => {
  const { LineOutbound } = await notice.get()

  const { bot, notify, id } = req.params
  if (id) {
    const data = await LineOutbound.findOne({ _id: id }, 'sender')
    if (!data) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Not found transactions outbound.'
      })
    }
    return data.sender
  }

  if (notify) {
    return (
      (await LineOutbound.find(
        { service: notify, type: 'notify' },
        'sended userTo created',
        { sort: { created: -1 }, skip: 0, limit: 100 }
      )) || []
    )
  }

  if (bot) {
    return (
      (await LineOutbound.find({ service: bot }, 'sended userTo created', {
        sort: { created: -1 },
        skip: 0,
        limit: 100
      })) || []
    )
  }
}
