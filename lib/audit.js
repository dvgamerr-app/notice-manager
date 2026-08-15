import { randomUUID } from 'node:crypto'
import { db } from './db.js'

export const audit = async ({
  actorType,
  actorId = null,
  botId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
}) => {
  await db
    .insertInto('managed_audit_log')
    .values({
      id: randomUUID(),
      actor_type: actorType,
      actor_id: actorId,
      bot_id: botId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata_payload: JSON.stringify(metadata),
      created_at: new Date().toISOString(),
    })
    .execute()
}
