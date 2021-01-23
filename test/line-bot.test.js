const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
const { create, prepare, remove } = require('./index.js')

const botname = process.env.BOT_NAME
const to = process.env.BOT_TO

describe('API LINE BOT', () => {
  let server

  beforeEach(async () => {
    await prepare()
    server = await create()
  })

  afterEach(async () => {
    await server.stop()
    await remove()
  })

  it('POST /bot responds with 400', async () => {
    const res = await server.inject({ method: 'POST', url: `/${botname}` })
    expect(res.statusCode).to.equal(400)
  })
  it('POST /bot responds with 200', async () => {
    const res = await server.inject({ method: 'POST', url: `/${botname}`, payload: { events: [] } })
    expect(res.statusCode).to.equal(200)
  })
  it('PUT /bot/to responds with 200', async () => {
    const res = await server.inject({ method: 'PUT', url: `/${botname}/${to}`, payload: { type: 'text', text: 'Testing' } })
    expect(res.statusCode).to.equal(200)
  })
})