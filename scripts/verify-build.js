import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '../lib/logger.js'

const projectRoot = join(import.meta.dirname, '..')
const buildRoot = join(projectRoot, 'dist', 'liff')
const htmlPath = join(buildRoot, 'index.html')

if (!existsSync(htmlPath)) {
  throw new Error('dist/liff/index.html is missing; run bun run build:ui first')
}

const html = readFileSync(htmlPath, 'utf8')
if (html.includes('/@vite/client') || html.includes('react-refresh')) {
  throw new Error('Production LIFF HTML contains Vite development runtime code')
}

const references = [...html.matchAll(/(?:src|href)="\/liff\/([^"?#]+)(?:[?#][^"]*)?"/g)]
  .map((match) => decodeURIComponent(match[1]))
const assets = references.filter((path) => /^assets\/.+\.(?:css|js)$/.test(path))

if (!assets.some((path) => /-[A-Za-z0-9_-]+\.js$/.test(path))) {
  throw new Error('Production LIFF HTML does not reference a hashed JavaScript asset')
}
if (!references.includes('favicon.svg')) {
  throw new Error('Production LIFF HTML does not reference /liff/favicon.svg')
}

for (const relativePath of new Set(references)) {
  if (relativePath.split('/').includes('..')) {
    throw new Error(`Unsafe build reference: ${relativePath}`)
  }
  if (!existsSync(join(buildRoot, ...relativePath.split('/')))) {
    throw new Error(`Missing production LIFF asset: ${relativePath}`)
  }
}

logger.info({ hashedAssets: assets.length }, 'Verified production LIFF build')
