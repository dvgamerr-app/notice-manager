import { fileURLToPath } from 'node:url'
import { logger } from '../lib/logger.js'

const port = 3100
const baseUrl = `http://127.0.0.1:${port}`
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

const waitForResponse = async (url, timeoutMs = 10_000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return response
    } catch {
      // The server has not started listening yet.
    }
    await Bun.sleep(100)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const server = Bun.spawn([process.execPath, 'index.js'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    DATABASE_URL: ':memory:',
    NODE_ENV: 'production',
    PORT: String(port),
  },
  stdout: 'inherit',
  stderr: 'inherit',
})

try {
  await waitForResponse(`${baseUrl}/health`)

  const root = await fetch(`${baseUrl}/`, { redirect: 'manual' })
  if (![301, 302, 307, 308].includes(root.status)) {
    throw new Error(`Expected a root redirect, received ${root.status}`)
  }
  if (!root.headers.get('location')?.endsWith('/liff/')) {
    throw new Error(`Unexpected root redirect: ${root.headers.get('location')}`)
  }

  const htmlResponse = await fetch(`${baseUrl}/liff/`)
  const html = await htmlResponse.text()
  if (!htmlResponse.ok || html.includes('/@vite/client')) {
    throw new Error('Production LIFF HTML check failed')
  }
  const assetPath = html.match(/src="(\/liff\/assets\/[^"]+\.js)"/)?.[1]
  if (!assetPath) throw new Error('Hashed production JavaScript reference missing')

  const [asset, favicon] = await Promise.all([
    fetch(`${baseUrl}${assetPath}`),
    fetch(`${baseUrl}/liff/favicon.svg`),
  ])
  if (!asset.ok || !favicon.ok) throw new Error('Production asset request failed')

  logger.info(
    { rootStatus: root.status, htmlStatus: htmlResponse.status, assetStatus: 200 },
    'Production smoke passed',
  )
} finally {
  server.kill()
  await server.exited
}

try {
  await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(500) })
  throw new Error(`Production smoke left port ${port} listening`)
} catch (error) {
  if (error instanceof Error && error.message.includes('left port')) throw error
}
