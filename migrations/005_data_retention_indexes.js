export async function up(db) {
  await db.schema
    .createIndex('app_session_expires_index')
    .ifNotExists()
    .on('app_session')
    .column('expires_at')
    .execute()

  await db.schema
    .createIndex('managed_webhook_received_index')
    .ifNotExists()
    .on('managed_webhook_event')
    .column('received_at')
    .execute()

  await db.schema
    .createIndex('managed_delivery_created_index')
    .ifNotExists()
    .on('managed_delivery')
    .column('created_at')
    .execute()

  await db.schema
    .createIndex('managed_audit_created_index')
    .ifNotExists()
    .on('managed_audit_log')
    .column('created_at')
    .execute()
}

export async function down(db) {
  await db.schema.dropIndex('managed_audit_created_index').ifExists().execute()
  await db.schema.dropIndex('managed_delivery_created_index').ifExists().execute()
  await db.schema.dropIndex('managed_webhook_received_index').ifExists().execute()
  await db.schema.dropIndex('app_session_expires_index').ifExists().execute()
}
