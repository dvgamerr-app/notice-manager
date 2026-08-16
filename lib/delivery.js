import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { audit } from './audit.js'
import { LineApiError, lineClient, normalizeMessages } from './sdk-line.js'
import { decryptSecret } from './secrets.js'
import { logger } from './logger.js'

const auditBestEffort = async (entry) => {
  try {
    await audit(entry)
  } catch (error) {
    logger.error({ err: error }, 'Unable to persist delivery audit event')
  }
}

export const deliverToChat = async ({
  bot,
  chat,
  messages: input,
  actorType,
  actorId,
  notificationDisabled,
}) => {
  const messages = normalizeMessages(input)
  const deliveryId = randomUUID()
  await db
    .insertInto('managed_delivery')
    .values({
      id: deliveryId,
      bot_id: bot.id,
      chat_id: chat.id,
      recipient_id: chat.source_id,
      message_payload: JSON.stringify(messages),
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .execute()

  try {
    const client = lineClient(decryptSecret(bot.channel_access_token))
    await client.validatePush(messages)
    const result = await client.push(chat.source_id, messages, { notificationDisabled })
    await db
      .updateTable('managed_delivery')
      .set({
        status: 'sent',
        line_request_id: result.requestId,
        response_payload: JSON.stringify(result.data),
        sent_at: new Date().toISOString(),
      })
      .where('id', '=', deliveryId)
      .execute()
    await auditBestEffort({
      actorType,
      actorId,
      botId: bot.id,
      action: 'message.send',
      entityType: 'chat',
      entityId: chat.id,
      metadata: { botId: bot.id, deliveryId, messageTypes: messages.map((message) => message.type) },
    })
    return { deliveryId, requestId: result.requestId, result: result.data }
  } catch (error) {
    const deliveryError = /** @type {Error & {
      requestId?: string | null,
      details?: any,
      deliveryId?: string,
      status?: number,
    }} */ (error instanceof Error ? error : new Error(String(error)))
    try {
      await db
        .updateTable('managed_delivery')
        .set({
          status: 'failed',
          line_request_id: deliveryError.requestId || null,
          error: deliveryError.message,
          response_payload: deliveryError.details
            ? JSON.stringify(deliveryError.details)
            : null,
        })
        .where('id', '=', deliveryId)
        .execute()
    } catch (recordError) {
      logger.error({ err: recordError, deliveryId }, 'Unable to persist failed delivery state')
    }
    await auditBestEffort({
      actorType,
      actorId,
      botId: bot.id,
      action: 'message.fail',
      entityType: 'chat',
      entityId: chat.id,
      metadata: {
        botId: bot.id,
        deliveryId,
        messageTypes: messages.map((message) => message.type),
        error: deliveryError.message,
      },
    })
    deliveryError.deliveryId = deliveryId
    if (!(deliveryError instanceof LineApiError) && !(deliveryError instanceof TypeError)) {
      deliveryError.status = 500
    }
    throw deliveryError
  }
}
