import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { DummyDriver, Kysely, PostgresDialect } from 'kysely'
import { requiresLiffTunnel } from '../liff/src/environment.js'
import { buildCompactFlexMessage } from '../liff/src/flex.js'
import { normalizeMessages, verifySignature } from '../lib/sdk-line.js'
import { up as createLineManagementSchema } from '../migrations/001_line_management.js'
import { up as createOperationsSchema } from '../migrations/002_management_operations.js'

process.env.DATABASE_URL = ':memory:'
process.env.LINE_LOGIN_CHANNEL_ID = '1234567890'
delete process.env.LINE_ADMIN_USER_IDS

let db
let migrateToLatest
let exchangeLiffAccessToken
let getSessionUser
let originalFetch
let createApp
let sessionToken

const installLineFetchMock = () => {
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url)
    if (target.includes('/oauth2/v2.1/verify')) {
      return Response.json({
        client_id: '1234567890',
        expires_in: 3600,
        scope: 'openid profile',
      })
    }
    if (target.endsWith('/v2/profile')) {
      return Response.json({
        userId: 'U00000000000000000000000000000001',
        displayName: 'Owner',
        pictureUrl: 'https://example.com/profile.png',
      })
    }
    if (target.endsWith('/v2/bot/info')) {
      const authorization = options.headers?.Authorization || options.headers?.authorization || ''
      const legacy = authorization.includes('legacy-access-token')
      return Response.json({
        userId: legacy
          ? 'U88888888888888888888888888888888'
          : 'U99999999999999999999999999999999',
        basicId: legacy ? '@legacybot' : '@managerbot',
        displayName: legacy ? 'Legacy Bot' : 'Manager Bot',
        pictureUrl: 'https://example.com/bot.png',
      })
    }
    if (target.includes('/v2/bot/profile/')) {
      return Response.json({
        displayName: 'Private chat user',
        pictureUrl: 'https://example.com/chat.png',
      })
    }
    if (target.endsWith('/v2/bot/message/quota')) {
      return Response.json({ type: 'limited', value: 1000 })
    }
    if (target.endsWith('/v2/bot/message/quota/consumption')) {
      return Response.json({ totalUsage: 12 })
    }
    if (target.endsWith('/v2/bot/message/validate/push')) {
      return Response.json({})
    }
    if (target.endsWith('/v2/bot/message/push')) {
      expect(options.method).toBe('POST')
      return Response.json(
        { sentMessages: [{ id: '12345' }] },
        { headers: { 'x-line-request-id': 'line-request-1' } },
      )
    }
    return new Response(null, { status: 404 })
  }
}

const getOwnerSession = async () => {
  if (sessionToken) return sessionToken
  installLineFetchMock()
  const auth = await exchangeLiffAccessToken('valid-liff-token')
  sessionToken = auth.token
  return sessionToken
}

describe('LIFF local environment', () => {
  const realLiff = { liffId: '1234567890-example', devBypass: false }

  test('requires a tunnel only for HTTP loopback hosts using real LIFF auth', () => {
    expect(requiresLiffTunnel(
      { protocol: 'http:', hostname: 'localhost' },
      realLiff,
    )).toBe(true)
    expect(requiresLiffTunnel(
      { protocol: 'http:', hostname: '127.0.0.1' },
      realLiff,
    )).toBe(true)
    expect(requiresLiffTunnel(
      { protocol: 'https:', hostname: 'localhost' },
      realLiff,
    )).toBe(false)
    expect(requiresLiffTunnel(
      { protocol: 'https:', hostname: 'calm-ocean-26dbc022.tunnl.gg' },
      realLiff,
    )).toBe(false)
    expect(requiresLiffTunnel(
      { protocol: 'http:', hostname: 'localhost' },
      { ...realLiff, devBypass: true },
    )).toBe(false)
  })
})

beforeAll(async () => {
  originalFetch = globalThis.fetch
  ;({ db, migrateToLatest } = await import('../lib/db.js'))
  ;({ exchangeLiffAccessToken, getSessionUser } = await import('../lib/auth.js'))
  ;({ createApp } = await import('../app.js'))
  await db.schema
    .createTable('line_bot')
    .addColumn('service', 'text', (column) => column.primaryKey())
    .addColumn('name', 'text')
    .addColumn('access_token', 'text')
    .addColumn('secret', 'text')
    .addColumn('active', 'integer')
    .execute()
  await migrateToLatest()
})

afterAll(async () => {
  globalThis.fetch = originalFetch
  await db.destroy()
})

describe('LINE webhook security', () => {
  test('accepts only the exact HMAC-SHA256 signature', () => {
    const secret = 'channel-secret'
    const body = '{"destination":"U123","events":[]}'
    const signature = createHmac('sha256', secret).update(body).digest('base64')
    expect(verifySignature(secret, body, signature)).toBe(true)
    expect(verifySignature(secret, `${body}\n`, signature)).toBe(false)
    expect(verifySignature(secret, body, '')).toBe(false)
  })

  test('normalizes text and enforces LINE message limits', () => {
    expect(normalizeMessages('hello')).toEqual([{ type: 'text', text: 'hello' }])
    expect(() => normalizeMessages([])).toThrow()
    expect(() => normalizeMessages(Array.from({ length: 6 }, () => ({ type: 'text' })))).toThrow()
  })
})

describe('compact Flex card', () => {
  test('builds a micro bubble with an optional URI action', () => {
    const message = buildCompactFlexMessage({
      title: 'Deployment complete',
      body: 'Production is healthy',
      actionLabel: 'Open dashboard',
      actionUri: 'https://example.com/dashboard',
    })
    expect(message).toMatchObject({
      type: 'flex',
      altText: 'Deployment complete',
      contents: {
        type: 'bubble',
        size: 'micro',
        footer: {
          contents: [{
            action: {
              type: 'uri',
              label: 'Open dashboard',
              uri: 'https://example.com/dashboard',
            },
          }],
        },
      },
    })
  })
})

describe('portable Kysely database', () => {
  test('runs every migration using Bun native SQLite', async () => {
    const tables = await db.introspection.getTables()
    const names = tables.map((table) => table.name)
    expect(names).toContain('app_session')
    expect(names).toContain('managed_bot')
    expect(names).toContain('managed_chat')
    expect(names).toContain('managed_webhook_event')
    expect(names).toContain('managed_delivery')
    expect(names).toContain('managed_api_key')
    expect(names).toContain('managed_audit_log')
  })

  test('compiles every migration operation for PostgreSQL', async () => {
    const postgres = new PostgresDialect({ pool: {} })
    const compileOnlyDb = new Kysely({
      dialect: {
        createAdapter: () => postgres.createAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (database) => postgres.createIntrospector(database),
        createQueryCompiler: () => postgres.createQueryCompiler(),
      },
    })
    await expect(createLineManagementSchema(compileOnlyDb)).resolves.toBeUndefined()
    await expect(createOperationsSchema(compileOnlyDb)).resolves.toBeUndefined()
    await compileOnlyDb.destroy()
  })
})

describe('LIFF reusable session', () => {
  test('verifies channel ownership and stores only a session hash', async () => {
    const token = await getOwnerSession()
    expect(token.length).toBeGreaterThan(32)
    const session = await getSessionUser({ authorization: `Bearer ${token}` })
    expect(session.id).toBe('U00000000000000000000000000000001')

    const stored = await db.selectFrom('app_session').select('token_hash').executeTakeFirstOrThrow()
    expect(stored.token_hash).not.toBe(token)
    expect(stored.token_hash).toHaveLength(64)
  })

  test('registers a bot, discovers a signed private chat, and test-pushes', async () => {
    const token = await getOwnerSession()
    installLineFetchMock()
    const app = createApp()
    const authorization = { Authorization: `Bearer ${token}` }

    await db.insertInto('line_bot').values({
      service: 'legacy-bot',
      name: 'Legacy Bot',
      access_token: 'legacy-access-token',
      secret: 'legacy-channel-secret',
      active: 1,
    }).execute()
    const importResponse = await app.handle(new Request('http://localhost/api/bots/import-legacy', {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: '{}',
    }))
    expect(importResponse.status).toBe(200)
    expect(await importResponse.json()).toMatchObject({ imported: 1, skipped: 0 })
    const importedCredential = await db
      .selectFrom('managed_bot')
      .select('channel_access_token')
      .where('service', '=', 'legacy-bot')
      .executeTakeFirstOrThrow()
    expect(importedCredential.channel_access_token).toStartWith('enc:v1:')

    const createResponse = await app.handle(new Request('http://localhost/api/bots', {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'manager-bot',
        name: 'Manager Bot',
        channelAccessToken: 'channel-access-token',
        channelSecret: 'channel-secret',
      }),
    }))
    expect(createResponse.status).toBe(201)

    const webhookPayload = JSON.stringify({
      destination: 'U99999999999999999999999999999999',
      events: [{
        type: 'message',
        webhookEventId: 'event-1',
        timestamp: Date.now(),
        source: {
          type: 'user',
          userId: 'U11111111111111111111111111111111',
        },
        message: { id: 'message-1', type: 'text', text: 'hello' },
      }],
    })
    const signature = createHmac('sha256', 'channel-secret')
      .update(webhookPayload)
      .digest('base64')
    const webhookResponse = await app.handle(
      new Request('http://localhost/webhooks/line/manager-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': signature,
        },
        body: webhookPayload,
      }),
    )
    expect(webhookResponse.status).toBe(200)
    expect(await webhookResponse.json()).toMatchObject({ accepted: 1, duplicates: 0 })
    const redeliveryResponse = await app.handle(
      new Request('http://localhost/webhooks/line/manager-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': signature,
        },
        body: webhookPayload,
      }),
    )
    expect(await redeliveryResponse.json()).toMatchObject({ accepted: 0, duplicates: 1 })

    const chatsResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/chats', { headers: authorization }),
    )
    const chats = await chatsResponse.json()
    expect(chats).toHaveLength(1)
    expect(chats[0]).toMatchObject({
      type: 'user',
      name: 'Private chat user',
      registered: true,
    })

    const pushResponse = await app.handle(
      new Request(`http://localhost/api/bots/manager-bot/chats/${chats[0].id}/test`, {
        method: 'POST',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Integration test' }),
      }),
    )
    expect(pushResponse.status).toBe(200)
    expect(await pushResponse.json()).toMatchObject({
      ok: true,
      requestId: 'line-request-1',
    })

    const renameResponse = await app.handle(
      new Request(`http://localhost/api/bots/manager-bot/chats/${chats[0].id}`, {
        method: 'PATCH',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Operations room' }),
      }),
    )
    expect(renameResponse.status).toBe(200)

    const refreshResponse = await app.handle(
      new Request(`http://localhost/api/bots/manager-bot/chats/${chats[0].id}/refresh`, {
        method: 'POST',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: '{}',
      }),
    )
    expect(refreshResponse.status).toBe(200)
    expect(await refreshResponse.json()).toMatchObject({
      name: 'Operations room',
      lineName: 'Private chat user',
      pictureUrl: 'https://example.com/chat.png',
    })

    const quotaResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/quota', { headers: authorization }),
    )
    expect(await quotaResponse.json()).toEqual({
      quota: { type: 'limited', value: 1000 },
      consumption: { totalUsage: 12 },
    })

    const createKeyResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/api-keys', {
        method: 'POST',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Integration' }),
      }),
    )
    expect(createKeyResponse.status).toBe(201)
    const createdKey = await createKeyResponse.json()
    expect(createdKey.key).toStartWith('lm_live_')

    const externalResponse = await app.handle(
      new Request(`http://localhost/v1/bots/manager-bot/chats/${chats[0].id}/messages`, {
        method: 'POST',
        headers: {
          'X-API-Key': createdKey.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            type: 'flex',
            altText: 'Integration flex',
            contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [] } },
          }],
        }),
      }),
    )
    expect(externalResponse.status).toBe(200)
    expect(await externalResponse.json()).toMatchObject({ ok: true })

    const deliveriesResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/deliveries', { headers: authorization }),
    )
    const deliveries = await deliveriesResponse.json()
    expect(deliveries).toHaveLength(2)
    expect(deliveries.every((row) => row.status === 'sent')).toBe(true)
    const deliveryPageResponse = await app.handle(
      new Request(
        'http://localhost/api/bots/manager-bot/deliveries?limit=1&offset=1',
        { headers: authorization },
      ),
    )
    expect(await deliveryPageResponse.json()).toHaveLength(1)

    const eventsResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/webhook-events', { headers: authorization }),
    )
    expect(await eventsResponse.json()).toHaveLength(1)

    const auditResponse = await app.handle(
      new Request('http://localhost/api/bots/manager-bot/audit-logs', { headers: authorization }),
    )
    const audits = await auditResponse.json()
    expect(audits.some((row) => row.action === 'message.send')).toBe(true)
  })
})

describe('Elysia application', () => {
  test('builds LIFF assets under their configured base path', async () => {
    const html = await Bun.file(new URL('../public/liff/index.html', import.meta.url)).text()
    const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path.startsWith('/liff/'))

    expect(assetPaths.some((path) => path.startsWith('/liff/assets/'))).toBe(true)
    expect(assetPaths).toContain('/liff/favicon.svg')

    for (const path of assetPaths) {
      const asset = Bun.file(new URL(`../public${path}`, import.meta.url))
      expect(await asset.exists()).toBe(true)
    }
  })

  test('serves health, returns real 404s, and protects the management API', async () => {
    const app = createApp()
    const health = await app.handle(new Request('http://localhost/health'))
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ ok: true })

    const missing = await app.handle(new Request('http://localhost/missing'))
    expect(missing.status).toBe(404)

    const session = await app.handle(new Request('http://localhost/api/session'))
    expect(session.status).toBe(401)
  })

  test('renders LIFF at the local root in development', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousBaseUrl = process.env.BASE_URL
    const previousPublicBaseUrl = process.env.PUBLIC_BASE_URL
    process.env.NODE_ENV = 'development'
    process.env.BASE_URL = 'http://localhost:3000'
    process.env.PUBLIC_BASE_URL = 'https://line-manager.example.com/'

    try {
      const app = createApp()
      const configResponse = await app.handle(
        new Request('http://localhost:3000/app/config'),
      )
      expect(configResponse.status).toBe(200)
      expect(await configResponse.json()).toEqual({
        publicBaseUrl: 'https://line-manager.example.com',
      })

      const rootResponse = await app.handle(new Request('http://localhost:3000/'))
      expect(rootResponse.status).toBe(200)
      expect(rootResponse.headers.get('content-type')).toContain('text/html')
      expect(await rootResponse.text()).toContain('<div id="root"></div>')
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousNodeEnv
      if (previousBaseUrl === undefined) delete process.env.BASE_URL
      else process.env.BASE_URL = previousBaseUrl
      if (previousPublicBaseUrl === undefined) delete process.env.PUBLIC_BASE_URL
      else process.env.PUBLIC_BASE_URL = previousPublicBaseUrl
    }
  })
})
