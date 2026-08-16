export async function up(db) {
  await db.schema
    .alterTable('managed_webhook_event')
    .addColumn('processing_status', 'text', (column) =>
      column.notNull().defaultTo('processed'))
    .execute()

  await db.schema
    .alterTable('managed_webhook_event')
    .addColumn('attempt_count', 'integer', (column) => column.notNull().defaultTo(1))
    .execute()

  await db.schema
    .alterTable('managed_webhook_event')
    .addColumn('last_attempt_at', 'text')
    .execute()

  await db.schema
    .alterTable('managed_webhook_event')
    .addColumn('processed_at', 'text')
    .execute()

  await db.schema
    .alterTable('managed_webhook_event')
    .addColumn('processing_error', 'text')
    .execute()

  await db
    .updateTable('managed_webhook_event')
    .set((expression) => ({
      last_attempt_at: expression.ref('received_at'),
      processed_at: expression.ref('received_at'),
    }))
    .execute()

  await db.schema
    .createIndex('managed_webhook_processing_index')
    .ifNotExists()
    .on('managed_webhook_event')
    .columns(['bot_id', 'processing_status'])
    .execute()
}

export async function down(db) {
  await db.schema.dropIndex('managed_webhook_processing_index').ifExists().execute()
  await db.schema.alterTable('managed_webhook_event').dropColumn('processing_error').execute()
  await db.schema.alterTable('managed_webhook_event').dropColumn('processed_at').execute()
  await db.schema.alterTable('managed_webhook_event').dropColumn('last_attempt_at').execute()
  await db.schema.alterTable('managed_webhook_event').dropColumn('attempt_count').execute()
  await db.schema.alterTable('managed_webhook_event').dropColumn('processing_status').execute()
}
