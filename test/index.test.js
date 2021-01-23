const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
const { create, prepare, remove } = require('./index.js')

describe('Init server hapi.', () => {
  let server

  beforeEach(async () => {
    await prepare()
    server = await create()
  })

  afterEach(async () => {
    await server.stop()
    await remove()
  })

  it('GET /health responds with 200', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).to.equal(200)
  })
})