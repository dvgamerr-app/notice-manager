import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

const PREFIX = 'enc:v1'

const key = () => {
  const material =
    process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET || ''
  if (!material && process.env.NODE_ENV === 'production') {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY is required in production')
  }
  return createHash('sha256')
    .update(material || 'line-manager-local-development-key')
    .digest()
}

export const encryptSecret = (value) => {
  if (!value || value.startsWith(`${PREFIX}:`)) return value
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv, tag, encrypted]
    .map((part) => Buffer.isBuffer(part) ? part.toString('base64url') : part)
    .join(':')
}

export const decryptSecret = (value) => {
  if (!value || !value.startsWith(`${PREFIX}:`)) return value
  const [, , ivValue, tagValue, encryptedValue] = value.split(':')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(ivValue, 'base64url'),
  )
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
