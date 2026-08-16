import { db } from '../../lib/db.js'
import { LineApiError } from '../../lib/sdk-line.js'
import { logger } from '../../lib/logger.js'

export const nowIso = () => new Date().toISOString()

const publicBaseUrl = () =>
  (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export const webhookUrl = (service) =>
  `${publicBaseUrl()}/line/${encodeURIComponent(service)}`

export const normalizeChannelAccessToken = (value) =>
  String(value || '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^Bearer[\s:]+/i, '')
    .replace(/[\s\u200B-\u200D\u2060\uFEFF]+/g, '')

export const unauthorized = (set) => {
  set.status = 401
  return { error: 'Authentication required' }
}

export const findBot = (service, userId) =>
  db
    .selectFrom('managed_bot')
    .selectAll()
    .where('service', '=', service)
    .where('owner_user_id', '=', userId)
    .executeTakeFirst()

export const botView = (bot) => ({
  id: bot.id,
  service: bot.service,
  name: bot.name,
  botUserId: bot.bot_user_id,
  basicId: bot.basic_id,
  pictureUrl: bot.picture_url,
  active: Boolean(bot.active),
  webhookEndpoint: bot.webhook_endpoint,
  expectedWebhookEndpoint: webhookUrl(bot.service),
  verifiedAt: bot.verified_at,
  createdAt: bot.created_at,
  updatedAt: bot.updated_at,
})

export const authenticationFailed = (error) =>
  error instanceof LineApiError && (
    error.status === 401 || /authentication failed/i.test(error.message)
  )

export const lineError = (
  error,
  { tokenVerification: verification } = /** @type {any} */ ({}),
) => {
  if (!(error instanceof LineApiError) && !(error instanceof TypeError)) {
    logger.error({ err: error }, 'Unexpected management operation failure')
    return {
      error: 'Unable to complete the management operation',
      requestId: null,
      details: null,
      lineStatus: null,
      lineReason: null,
      tokenVerification: null,
    }
  }

  return {
    error: authenticationFailed(error)
      ? verification?.lineLoginToken
        ? 'Token นี้ยัง valid แต่เป็น LINE Login/LIFF access token กรุณาใช้ Channel Access Token จาก Messaging API channel'
        : verification?.valid
          ? `Channel Access Token ยัง valid สำหรับ Channel ID ${verification.channelId || '(ไม่ทราบ)'} แต่ LINE ปฏิเสธ Get bot info กรุณาเทียบ Channel ID นี้กับ Messaging API channel ที่ต้องการเพิ่ม`
          : 'Channel Access Token ใช้งานไม่ได้ กรุณาใช้ token จาก Messaging API channel และออก token ใหม่หากถูก revoke หรือหมดอายุ'
      : error.message || 'LINE API request failed',
    requestId: error instanceof LineApiError ? error.requestId || null : null,
    details: error instanceof LineApiError ? error.details || null : null,
    lineStatus: error instanceof LineApiError ? error.status || null : null,
    lineReason: error.message || null,
    tokenVerification: verification || null,
  }
}

export const safeJson = (value, fallback = null) => {
  if (value == null || typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const boundedInteger = (value, fallback, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.trunc(number)))
}

export const pageLimit = (query, maximum = 100) =>
  boundedInteger(query?.limit, 50, 1, maximum)

export const pageOffset = (query) => boundedInteger(query?.offset, 0, 0, 100_000)
