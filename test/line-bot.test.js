const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
const { create, prepare, remove } = require('./index.js')

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

  it('POST /e-ngo responds with 400', async () => {
    const res = await server.inject({ method: 'POST', url: '/e-ngo' })
    expect(res.statusCode).to.equal(400)
  })
  it('POST /e-ngo responds with 200', async () => {
    const res = await server.inject({ method: 'POST', url: '/e-ngo', payload: { events: [] } })
    expect(res.statusCode).to.equal(200)
  })
})